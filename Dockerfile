#  
# Copyright (C) 2016-2021 phantombot.github.io/PhantomBot
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
FROM adoptopenjdk:11-jdk-hotspot-bionic as builder

ARG PROJECT_NAME=PhantomBot
ARG PROJECT_VERSION
ARG BASEDIR=/opt/${PROJECT_NAME}
ARG BUILDDIR=${BASEDIR}_build
ARG DATADIR=${BASEDIR}_data
ARG ANT_ARGS=

ENV DEBIAN_FRONTEND=noninteractive
RUN mkdir -p "${BUILDDIR}" "${DATADIR}" \
    && apt-get update -q \
    && apt-get install -yqq ant \
    && apt-get clean \
    && rm -rf \
        /var/lib/apt/lists/* \
        /tmp/* \
        /var/tmp/*

COPY . "${BUILDDIR}"

RUN cd "${BUILDDIR}" \
    && ant -noinput -buildfile build.xml -Disdocker=true ${ANT_ARGS} jar

RUN cd "${BUILDDIR}/dist/${PROJECT_NAME}-${PROJECT_VERSION}/" \
    && ls | grep java-runtime | xargs --no-run-if-empty rm -rf \
    && ls | grep launch | grep -v launch-docker.sh | xargs --no-run-if-empty rm -rf

RUN cd "${BUILDDIR}/dist/${PROJECT_NAME}-${PROJECT_VERSION}/" \
    && mkdir "${DATADIR}/scripts" \
    && mkdir "${DATADIR}/scripts/custom" \
    && mkdir "${DATADIR}/scripts/discord" \
    && mkdir "${DATADIR}/scripts/lang" \
    && mv "./addons" "${DATADIR}/" \
    && mv "./config" "${DATADIR}/" \
    && mv "./logs" "${DATADIR}/" \
    && mv "./scripts/custom" "${DATADIR}/scripts/custom/" \
    && mv "./scripts/discord/custom" "${DATADIR}/scripts/discord/" \
    && mv "./scripts/lang/custom" "${DATADIR}/scripts/lang/"

# Application container
FROM adoptopenjdk:11-jre-hotspot-bionic

ARG PROJECT_NAME=PhantomBot
ARG PROJECT_VERSION
ARG BASEDIR=/opt/${PROJECT_NAME}
ARG BUILDDIR=${BASEDIR}_build
ARG DATADIR=${BASEDIR}_data

USER root

RUN groupadd -r phantombot -g 900 \
    && useradd -u 901 -r -g phantombot -s /sbin/nologin -c "PhantomBot Daemon User" phantombot

RUN mkdir -p "${BASEDIR}" "${DATADIR}"

COPY --from=builder --chown=phantombot:phantombot "${DATADIR}/." "${DATADIR}/"

COPY --from=builder --chown=phantombot:phantombot "${BUILDDIR}/dist/${PROJECT_NAME}-${PROJECT_VERSION}/." "${BASEDIR}/"

USER phantombot:phantombot

RUN cd "${BASEDIR}" \
    && mkdir "${DATADIR}/dbbackup" \
    && ln -s "${DATADIR}/addons" \
    && ln -s "${DATADIR}/config" \
    && ln -s "${DATADIR}/dbbackup" \
    && ln -s "${DATADIR}/logs" \
    && ln -s "${DATADIR}/scripts/custom" "${BASEDIR}/scripts/custom" \
    && ln -s "${DATADIR}/scripts/discord" "${BASEDIR}/scripts/discord/custom" \
    && ln -s "${DATADIR}/scripts/lang" "${BASEDIR}/scripts/lang/custom" \
    && chmod u+x ${BASEDIR}/launch-docker.sh

VOLUME "${DATADIR}"

WORKDIR "${BASEDIR}"

EXPOSE 25000

CMD ["bash", "launch-docker.sh"]
