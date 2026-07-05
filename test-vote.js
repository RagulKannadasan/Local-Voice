const voterString = 'USER::Ragul Kannadasan::ragulkavai@gmail.com';
let rawEmail = voterString;
if (voterString.startsWith('USER::')) {
  const parts = voterString.split('::');
  if (parts.length >= 3) rawEmail = parts[2];
}
console.log(rawEmail);
