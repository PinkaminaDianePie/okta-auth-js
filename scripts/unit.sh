#!/bin/bash -x

source ${OKTA_HOME}/${REPO}/scripts/setup.sh "v14.18.0"

export TEST_SUITE_TYPE="junit"
export TEST_RESULT_FILE_DIR="${REPO}/build2/reports/unit"

if ! yarn test:unit; then
  echo "unit failed! Exiting..."
  exit ${TEST_FAILURE}
fi

if ! yarn test:bundle:esm:browser; then
  echo "validate ESM browser bundle failed! Exiting..."
  exit ${TEST_FAILURE}
fi

if ! yarn test:bundle:esm:node; then
  echo "validate ESM node bundle failed! Exiting..."
  exit ${TEST_FAILURE}
fi

if ! yarn test:bundle:cjs; then
  echo "validate cjs bundle failed! Exiting..."
  exit ${TEST_FAILURE}
fi

echo ${TEST_SUITE_TYPE} > ${TEST_SUITE_TYPE_FILE}
echo ${TEST_RESULT_FILE_DIR} > ${TEST_RESULT_FILE_DIR_FILE}
exit ${PUBLISH_TYPE_AND_RESULT_DIR}
