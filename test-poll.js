async function test() {
  const res = await fetch('http://localhost:3000/api/polls');
  const data = await res.json();
  console.log('Polls:', JSON.stringify(data.polls, null, 2));
}
test();
