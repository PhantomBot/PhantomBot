FROM openjdk:8-jdk

ARG project_name=PhantomBot
ARG BASEDIR=/opt/${project_name}

RUN mkdir -p "${BASEDIR}"

VOLUME \
    "${BASEDIR}/addons" \
    "${BASEDIR}/botlogin.txt" \
    "${BASEDIR}/config" \
    "${BASEDIR}/logs" \
    "${BASEDIR}/phantombot.db" \
    "${BASEDIR}/phantombot.db-journal"

COPY . "$BASEDIR"

WORKDIR "$BASEDIR"

EXPOSE 25000 25002 25003 25004 25005

ENTRYPOINT [ \
    "java", \
    "-Dinteractive", \
    "-Dfile.encoding=UTF-8", \
    "-jar", \
    "PhantomBot.jar" \
]