#  
# Copyright (C) 2016-2019 phantombot.tv
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
FROM openjdk:11.0.4-jdk as builder

ARG PROJECT_NAME=PhantomBot
ARG BASEDIR=/opt/${PROJECT_NAME}
ARG BUILDDIR=${BASEDIR}_build
ARG DATADIR=${BASEDIR}_data

ENV DEBIAN_FRONTEND=noninteractive
RUN mkdir -p "${BUILDDIR}" \
    && apt-get update -q \
    && apt-get install -yqq ant \
    && apt-get clean \
    && rm -rf \
        /var/lib/apt/lists/* \
        /tmp/* \
        /var/tmp/*

COPY . "${BUILDDIR}"

RUN cd "${BUILDDIR}" \
    && ant jar

# Application container
FROM azul/zulu-openjdk-alpine:11.0.4-jre

ARG PROJECT_NAME=PhantomBot
ARG BASEDIR=/opt/${PROJECT_NAME}
ARG BUILDDIR=${BASEDIR}_build
ARG DATADIR=${BASEDIR}_data

RUN mkdir -p "${BASEDIR}" "${DATADIR}" "${BASEDIR}/logs"

COPY --from=builder "${BUILDDIR}/dist/${PROJECT_NAME}-3.1.2/." "${BASEDIR}/"

RUN cd "${BASEDIR}" \
    && rm -rf \
    && mkdir "${DATADIR}/scripts" \
    && mkdir "${DATADIR}/scripts/custom" \
    && mkdir "${DATADIR}/scripts/discord" \
    && mkdir "${DATADIR}/scripts/lang" \
    && mv "${BASEDIR}/addons" "${DATADIR}/" \
    && mv "${BASEDIR}/config" "${DATADIR}/" \
    && mv "${BASEDIR}/logs" "${DATADIR}/" \
    && mv "${BASEDIR}/scripts/custom" "${DATADIR}/scripts/custom/" \
    && mv "${BASEDIR}/scripts/discord/custom" "${DATADIR}/scripts/discord/" \
    && mv "${BASEDIR}/scripts/lang/custom" "${DATADIR}/scripts/lang/" \
    && mkdir "${DATADIR}/dbbackup" \
    && ln -s "${DATADIR}/addons" \
    && ln -s "${DATADIR}/config" \
    && ln -s "${DATADIR}/dbbackup" \
    && ln -s "${DATADIR}/logs" \
    && ln -s "${DATADIR}/scripts/custom" "${BASEDIR}/scripts/custom" \
    && ln -s "${DATADIR}/scripts/discord" "${BASEDIR}/scripts/discord/custom" \
    && ln -s "${DATADIR}/scripts/lang" "${BASEDIR}/scripts/lang/custom"

VOLUME "${DATADIR}"

WORKDIR "${BASEDIR}"

EXPOSE 25000

CMD ["sh", "launch-service.sh"]
