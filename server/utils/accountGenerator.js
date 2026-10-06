export const generateAccountNumber = () => {
  // Generate 12-digit bank account number starting with 60
  const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000);
  return `60${randomDigits}`;
};

export const generateTransactionId = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TXN${timestamp}${random}`;
};

export const generateChequeBookId = () => {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `CHQ${random}`;
};

export const generateReferenceNo = () => {
  const random = Math.floor(10000000 + Math.random() * 90000000);
  return `REF${random}`;
};
