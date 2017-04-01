FROM openjdk:8-jdk

ARG PROJECT_NAME=PhantomBot
ARG BASEDIR=/opt/${PROJECT_NAME}
ARG BUILDDIR=${BASEDIR}_build
ARG VERSION=master

RUN mkdir -p "${BASEDIR}" "${BUILDDIR}" \
    && apt-get update -q \
    && apt-get install -yqq ant \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* \
    && git clone --branch "${VERSION}" https://github.com/PhantomBot/PhantomBot.git "${BUILDDIR}" \
    && cd "${BUILDDIR}" \
    && ant jar \
    && cp -aR "${BUILDDIR}/dist/build" "${BASEDIR}/" \
    && rm -rf "${BUILDDIR}" "${BASEDIR}/\{launch*,Dockerfile,docker-compose.yml\}"

VOLUME \
    "${BASEDIR}/addons" \
    "${BASEDIR}/botlogin.txt" \
    "${BASEDIR}/config" \
    "${BASEDIR}/logs" \
    "${BASEDIR}/phantombot.db" \
    "${BASEDIR}/phantombot.db-journal"

WORKDIR "${BASEDIR}"

EXPOSE 25000 25001 25002 25003 25004 25005

CMD [ \
        "java", \
        "-Dinteractive", \
        "-Dfile.encoding=UTF-8", \
        "-jar", \
        "PhantomBot.jar" \
    ]