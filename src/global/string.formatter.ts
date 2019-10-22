/*
 * String formatting functions
 */
const REGEX_NON_PRINTABLE_CHARS: RegExp = /[^ -\xFF€]+/g;

export const removeNonPrintableChars = (inputStr: string): string => {
  if (inputStr) {
    return inputStr.replace(REGEX_NON_PRINTABLE_CHARS, " ");
  } else {
    return inputStr;
  }
};
