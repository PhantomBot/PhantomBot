# Build container
FROM openjdk:8-jdk as builder

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
FROM openjdk:8-jre-alpine

ARG PROJECT_NAME=PhantomBot
ARG BASEDIR=/opt/${PROJECT_NAME}
ARG BUILDDIR=${BASEDIR}_build
ARG DATADIR=${BASEDIR}_data

RUN mkdir -p "${BASEDIR}" "${DATADIR}" "${BASEDIR}/logs"

COPY --from=builder "${BUILDDIR}/dist/build/." "${BASEDIR}/"

RUN cd "${BASEDIR}" \
    && rm -rf \
    && mv "${BASEDIR}/addons" "${DATADIR}/" \
    && mv "${BASEDIR}/logs" "${DATADIR}/" \
    && ln -s "${DATADIR}/addons" \
    && ln -s "${DATADIR}/botlogin.txt" \
    && ln -s "${DATADIR}/logs" \
    && ln -s "${DATADIR}/phantombot.db"

VOLUME "${DATADIR}"

WORKDIR "${BASEDIR}"

EXPOSE 25000 25001 25002 25003 25004 25005

CMD [ \
        "java", \
        "-Dinteractive", \
        "-Dfile.encoding=UTF-8", \
        "-jar", \
        "PhantomBot.jar" \
    ]
