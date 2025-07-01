#
# Copyright (C) 2016-2024 phantombot.github.io/PhantomBot
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
#

# Build container
FROM --platform=${BUILDPLATFORM} eclipse-temurin:17-jdk AS builder

ARG PROJECT_NAME=PhantomBot
ARG PROJECT_VERSION
ARG BASEDIR=/opt/${PROJECT_NAME}
ARG BUILDDIR=${BASEDIR}_build
ARG LIBDIR=${BASEDIR}_lib
ARG DATADIR=${BASEDIR}_data
ARG ANT_ARGS=

ENV DEBIAN_FRONTEND=noninteractive
RUN set -eux; \
    mkdir -p "${BUILDDIR}" "${DATADIR}"; \
    apt-get update; \
    cd root; apt-get download ant; \
    dpkg --ignore-depends=default-jre-headless --install ant_*.deb; \
    apt-get clean; \
    rm -rf \
        /var/lib/apt/lists/* \
        /tmp/* \
        /var/tmp/* \
        /root/*.deb

COPY build.xml ivysettings.xml ivy.xml "${BUILDDIR}/"
RUN set -eux; \
    cd "${BUILDDIR}"; \
    ant -noinput -buildfile build.xml -Disdocker=true ${ANT_ARGS} ivy-retrieve

COPY . "${BUILDDIR}"

RUN set -eux; \
    cd "${BUILDDIR}"; \
    ant -noinput -buildfile build.xml -Disdocker=true ${ANT_ARGS} jar; \
    cd "${BUILDDIR}/dist/${PROJECT_NAME}-${PROJECT_VERSION}"; \
    mv "./lib" "${LIBDIR}"; ln -s "${LIBDIR}" "./lib"

RUN set -eux; \
    cd "${BUILDDIR}/dist/${PROJECT_NAME}-${PROJECT_VERSION}/"; \
    ls | grep java-runtime | xargs --no-run-if-empty rm -rf; \
    ls | grep launch | grep -v launch-docker.sh | xargs --no-run-if-empty rm -rf; \
    ls | grep restartbot | grep -v restartbot-docker.sh | xargs --no-run-if-empty rm -rf; \
    cd "${BUILDDIR}/dist/${PROJECT_NAME}-${PROJECT_VERSION}/config/healthcheck/failurehooks"; \
    ls | grep restart | grep -v restart-docker-internal.py | xargs --no-run-if-empty rm -rf

RUN set -eux; \
    cd "${BUILDDIR}/dist/${PROJECT_NAME}-${PROJECT_VERSION}/"; \
    mkdir "${DATADIR}/scripts"; \
    mkdir "${DATADIR}/scripts/custom"; \
    mkdir "${DATADIR}/scripts/discord"; \
    mkdir "${DATADIR}/scripts/lang"; \
    mkdir "${DATADIR}/logs"; \
    mv "./addons" "${DATADIR}/"; \
    mv "./config" "${DATADIR}/"; \
    mv "./scripts/custom" "${DATADIR}/scripts/custom/"; \
    mv "./scripts/discord/custom" "${DATADIR}/scripts/discord/"; \
    mv "./scripts/lang/custom" "${DATADIR}/scripts/lang/"; \
    rm "./lib"

# Application container
FROM eclipse-temurin:17-jre AS publish

ARG PROJECT_NAME=PhantomBot
ARG PROJECT_VERSION
ARG BASEDIR=/opt/${PROJECT_NAME}
ARG BUILDDIR=${BASEDIR}_build
ARG LIBDIR=${BASEDIR}_lib
ARG DATADIR=${BASEDIR}_data

USER root

RUN set -eux;  \
    apt-get update; \
    apt-get install -y --no-install-recommends util-linux python3 python3-pip python3-venv; \
    apt-get clean; \
    rm -rf /var/lib/apt/lists/*; \
    apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false

RUN set -eux; \
    userdel -r ubuntu; \
    groupadd -r phantombot -g 900; \
    useradd -u 901 -r -g phantombot -s /sbin/nologin -c "PhantomBot Daemon User" phantombot

RUN set -eux; \
    mkdir -p "${BASEDIR}" "${DATADIR}"; \
    chown phantombot:phantombot "${BASEDIR}"; \
    chown phantombot:phantombot "${DATADIR}"

ENV PATH="${BASEDIR}:$PATH"

COPY --from=builder --chown=phantombot:phantombot "${LIBDIR}" "${BASEDIR}/lib"

COPY --from=builder "${DATADIR}/config/healthcheck/requirements.txt" "${DATADIR}/config/healthcheck/"

RUN set -eux;  \
    python3 -m venv /opt/python3/venv; \
    /opt/python3/venv/bin/pip install --no-cache-dir -r "${DATADIR}/config/healthcheck/requirements.txt"

COPY --from=builder "${DATADIR}/config/healthcheck/healthcheck.py" "${BASEDIR}/"

COPY --from=builder --chown=phantombot:phantombot "${DATADIR}/." "${DATADIR}/"

COPY --from=builder --chown=phantombot:phantombot "${BUILDDIR}/dist/${PROJECT_NAME}-${PROJECT_VERSION}/." "${BASEDIR}/"

RUN set -eux; \
    cd "${BASEDIR}"; \
    mkdir "${DATADIR}/dbbackup"; \
    mkdir "${DATADIR}/gameslist"; \
    ln -s "${DATADIR}/addons"; \
    ln -s "${DATADIR}/config"; \
    ln -s "${DATADIR}/dbbackup"; \
    ln -s "${DATADIR}/logs"; \
    ln -s "${DATADIR}/scripts/custom" "${BASEDIR}/scripts/custom"; \
    ln -s "${DATADIR}/scripts/discord" "${BASEDIR}/scripts/discord/custom"; \
    ln -s "${DATADIR}/scripts/lang" "${BASEDIR}/scripts/lang/custom"; \
    touch "${DATADIR}/gameslist/gamesList.txt"; \
    ln -s "${DATADIR}/gameslist/gamesList.txt" "${BASEDIR}/web/panel/js/utils/gamesList.txt"; \
    touch "${DATADIR}/java.opt.custom"; \
    ln -s "${DATADIR}/java.opt.custom" "${BASEDIR}/java.opt.custom"; \
    chmod u+x "${BASEDIR}/restartbot-docker.sh"; \
    chmod u+x "${BASEDIR}/launch-docker.sh"; \
    chmod u+x "${BASEDIR}/docker-entrypoint.sh"

VOLUME "${DATADIR}"

WORKDIR "${BASEDIR}"

HEALTHCHECK --interval=5m --timeout=1m --start-period=2m CMD /opt/python3/venv/bin/python /opt/PhantomBot/healthcheck.py --show-success --config-dir /opt/PhantomBot_data/config/ --hook-dir /opt/PhantomBot_data/config/healthcheck/

ENTRYPOINT ["docker-entrypoint.sh"]

EXPOSE 25000

CMD ["launch-docker.sh"]
