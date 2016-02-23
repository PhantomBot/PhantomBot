#!/bin/bash

if [[ ${PWD} != *javascript-source ]]; then
  echo "error: must be ran in the javascript-source directory."
  exit
fi

hash uglifyjs 2>/dev/null 
if [[ $? != "0" ]]; then
  echo "error: uglifyjs is not found in the path."
  exit
fi

if [[ $# == "0" ]]; then
  echo "usage: uglify.sh ALL | file.js path/file.js ..."
  exit 
fi

if [[ $1 == "ALL" ]]; then
  for file in $(find . -name "*.js"); do
    file=${file#./}
    echo "uglifyjs ${file} -c -m > ../resources/scripts/${file}"
    uglifyjs ${file} -c -m > ../resources/scripts/${file}
  done
  exit
fi

while (( $# )); do
  if [[ ! -e $1 ]]; then
    echo "warning: file not found: $1"
  else
    echo "uglifyjs $1 -c -m > ../resources/scripts/$1"
    uglifyjs $1 -c -m > ../resources/scripts/$1
  fi
  shift
done

