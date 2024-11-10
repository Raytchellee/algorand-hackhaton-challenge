export const beautifyError = (error: string) => {
  if (error.includes('overspend')) {
    return 'Your balance is insufficient to complete the transaction';
  }

  if (error.includes('does not exist or has been deleted')) {
    return `The asset you are trying to opt into does not exist or has been deleted`;
  }

  return error;
};
