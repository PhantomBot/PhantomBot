#!/usr/bin/make

.PHONY: build run rebuild kill

PROJECT_NAME = PhantomBot
PROJECT_VERSION = custom
BASEDIR = "./dist"
BUILDDIR := "${PROJECT_NAME}-${PROJECT_VERSION}"
RUNTIMEPATH := "${BUILDDIR}/java-runtime-linux/bin/java"
LAUNCHPATH := "${BUILDDIR}/launch-service.sh"

export LAUNCHPATH

build:
	echo "Building PhantomBot!" \
	&& mkdir -p "${BASEDIR}" \
	&& cd "${BASEDIR}" \
	&& ant -noinput -buildfile ../build.xml -Disdocker=true ${ANT_ARGS} jar \
	&& chmod u+x ${RUNTIMEPATH} \
	&& chmod u+x ${LAUNCHPATH}

run:
	if [ -f ${JARPATH} ]; then \
		${BASEDIR}/${LAUNCHPATH}; \
	fi;

rebuild: build run

kill:
	kill $$(ps aux | grep '[P]hantomBot.jar' | awk '{print $$2}')
