FROM openjdk:8-jdk

ARG project_name=PhantomBot
ARG BASEDIR=/opt/${project_name}

RUN mkdir -p "${BASEDIR}"

VOLUME "${BASEDIR}/config" "${BASEDIR}/logs"

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