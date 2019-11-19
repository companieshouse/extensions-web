export const updateDateErrorMessage = (errorMessage: string, dataToAppend: string, isFirstError: boolean): string => {
  let updatedErrorMessage: string = errorMessage;
  if (!isFirstError) {
    updatedErrorMessage += " and a";
  }
  return updatedErrorMessage + " " + dataToAppend;
};
