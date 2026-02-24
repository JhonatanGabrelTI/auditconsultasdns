require('dotenv').config();
console.log('--- ENV TEST ---');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL starts with:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) : 'MISSING');
console.log('----------------');
