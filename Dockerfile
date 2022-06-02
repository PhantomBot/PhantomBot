#  
# Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
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
FROM eclipse-temurin:11-jdk-focal as builder

ARG PROJECT_NAME=PhantomBot
ARG PROJECT_VERSION
ARG BASEDIR=/opt/${PROJECT_NAME}
ARG BUILDDIR=${BASEDIR}_build
ARG DATADIR=${BASEDIR}_data
ARG ANT_ARGS=

ENV DEBIAN_FRONTEND=noninteractive
RUN set -eux; \
    mkdir -p "${BUILDDIR}" "${DATADIR}"; \
    apt-get update; \
    apt-get install -y --no-install-recommends ant; \
    apt-get clean; \
    rm -rf \
        /var/lib/apt/lists/* \
        /tmp/* \
        /var/tmp/*

COPY . "${BUILDDIR}"

RUN set -eux; \
    cd "${BUILDDIR}"; \
    ant -noinput -buildfile build.xml -Disdocker=true ${ANT_ARGS} jar

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
    mv "./addons" "${DATADIR}/"; \
    mv "./config" "${DATADIR}/"; \
    mv "./logs" "${DATADIR}/"; \
    mv "./scripts/custom" "${DATADIR}/scripts/custom/"; \
    mv "./scripts/discord/custom" "${DATADIR}/scripts/discord/"; \
    mv "./scripts/lang/custom" "${DATADIR}/scripts/lang/"

# Application container
FROM eclipse-temurin:11-jre-focal as publish

ARG PROJECT_NAME=PhantomBot
ARG PROJECT_VERSION
ARG BASEDIR=/opt/${PROJECT_NAME}
ARG BUILDDIR=${BASEDIR}_build
ARG DATADIR=${BASEDIR}_data

USER root

RUN set -eux; \
    groupadd -r phantombot -g 900; \
    useradd -u 901 -r -g phantombot -s /sbin/nologin -c "PhantomBot Daemon User" phantombot

RUN set -eux; \
    mkdir -p "${BASEDIR}" "${DATADIR}"; \
    chown phantombot:phantombot "${BASEDIR}"; \
    chown phantombot:phantombot "${DATADIR}"

ENV PATH="${BASEDIR}:$PATH"

ENV GOSU_VERSION 1.14

RUN set -eux; \
# save list of currently installed packages for later so we can clean up
	savedAptMark="$(apt-mark showmanual)"; \
	apt-get update; \
	apt-get install -y --no-install-recommends ca-certificates wget; \
	if ! command -v gpg; then \
		apt-get install -y --no-install-recommends gnupg2 dirmngr; \
	elif gpg --version | grep -q '^gpg (GnuPG) 1\.'; then \
# "This package provides support for HKPS keyservers." (GnuPG 1.x only)
		apt-get install -y --no-install-recommends gnupg-curl; \
	fi; \
	rm -rf /var/lib/apt/lists/*; \
	\
	dpkgArch="$(dpkg --print-architecture | awk -F- '{ print $NF }')"; \
	wget -O /usr/local/bin/gosu "https://github.com/tianon/gosu/releases/download/$GOSU_VERSION/gosu-$dpkgArch"; \
	wget -O /usr/local/bin/gosu.asc "https://github.com/tianon/gosu/releases/download/$GOSU_VERSION/gosu-$dpkgArch.asc"; \
	\
# verify the signature
	export GNUPGHOME="$(mktemp -d)"; \
	gpg --batch --keyserver hkps://keys.openpgp.org --recv-keys B42F6819007F00F88E364FD4036A9C25BF357DD4; \
	gpg --batch --verify /usr/local/bin/gosu.asc /usr/local/bin/gosu; \
	command -v gpgconf && gpgconf --kill all || :; \
	rm -rf "$GNUPGHOME" /usr/local/bin/gosu.asc; \
	\
# clean up fetch dependencies
	apt-mark auto '.*' > /dev/null; \
	[ -z "$savedAptMark" ] || apt-mark manual $savedAptMark; \
	apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false; \
	\
	chmod +x /usr/local/bin/gosu; \
# verify that the binary works
	gosu --version; \
	gosu nobody true

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
    chmod u+x "${BASEDIR}/restartbot-docker.sh"; \
    chmod u+x "${BASEDIR}/launch-docker.sh"; \
    chmod u+x "${BASEDIR}/docker-entrypoint.sh"

RUN set -eux;  \
    apt-get update; \
    apt-get install -y --no-install-recommends python3 python3-pip; \
    apt-get clean; \
    rm -rf /var/lib/apt/lists/*; \
    pip3 install --no-cache-dir -r "${BASEDIR}/config/healthcheck/requirements.txt"; \
    apt-get remove -y python3-pip; \
    apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false

VOLUME "${DATADIR}"

WORKDIR "${BASEDIR}"

HEALTHCHECK --interval=5m --timeout=1m --start-period=2m CMD python3 /opt/PhantomBot/config/healthcheck/healthcheck.py --show-success --config-dir /opt/PhantomBot_data/config/

ENTRYPOINT ["docker-entrypoint.sh"]

EXPOSE 25000

CMD ["launch-docker.sh"]
