const input = `
LIPARI WALTER ANTONIO - 39259.55 (01-12)
CONTRERAS FRANCISCO ANTONIO - 45419.45 (01-12)
BUZZONE CINTIA ELISABET - 39699.63 (04-12)
GARCIA PADILLA SANDRO RAFAEL - 41759.30 (04-12)
27665.00
33567.00
31081.00
31700.00
27747.00
28703.00
30279.00
31046.00
32776.00
35356.00
29349.00
34854.00
33090.00
29401.00
`;

// Extract numbers from the input, considering both integers and decimals
const numbers = input.match(/-?\d+(\.\d+)?/g).map(parseFloat);

// Function to calculate the sum
const calculateSum = (numbers) => {
  return numbers.reduce((sum, number) => sum + number, 0);
};

// Output the sum
console.log("The sum is:", calculateSum(numbers));
