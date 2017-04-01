FROM openjdk:8-jdk

ARG PROJECT_NAME=PhantomBot
ARG BASEDIR=/opt/${PROJECT_NAME}

RUN mkdir -p "${BASEDIR}"

VOLUME \
    "${BASEDIR}/addons" \
    "${BASEDIR}/botlogin.txt" \
    "${BASEDIR}/config" \
    "${BASEDIR}/logs" \
    "${BASEDIR}/phantombot.db" \
    "${BASEDIR}/phantombot.db-journal"

COPY . "$BASEDIR"

WORKDIR "${BASEDIR}"

EXPOSE 25000 25001 25002 25003 25004 25005

ENTRYPOINT [ \
    "java", \
    "-Dinteractive", \
    "-Dfile.encoding=UTF-8", \
    "-jar", \
    "PhantomBot.jar" \
]