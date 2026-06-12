
async function verifyAdmin() {
    const BASE = 'http://localhost:3000/api';
    const adminEmail = 'admin@kifahbiology.com';
    const adminPass = 'admin123';
    let token = '';

    console.log('1. Admin Login...');
    const loginRes = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: adminPass })
    });

    if (!loginRes.ok) throw new Error('Admin login failed');
    const loginData = await loginRes.json();
    token = loginData.token;
    console.log('✅ Admin Logged in');

    console.log('\n2. Creating Question...');
    const createRes = await fetch(`${BASE}/questions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            weekId: 99,
            weekTitle: 'Test Week',
            question: 'Test Question',
            options: ['A', 'B', 'C'],
            correctAnswer: 0,
            points: 5
        })
    });

    if (createRes.ok) console.log('✅ Question Created');
    else console.error('❌ Create Failed', await createRes.text());

    console.log('\n3. Verifying Creation...');
    const getRes = await fetch(`${BASE}/questions`);
    const weeks = await getRes.json();
    const testWeek = weeks.find((w: any) => w.id === 99);

    if (testWeek && testWeek.questions.length > 0) {
        console.log('✅ Question found in DB');
        const qId = testWeek.questions[0].id;

        console.log('\n4. Deleting Question...');
        const delRes = await fetch(`${BASE}/questions/${qId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (delRes.ok) console.log('✅ Question Deleted');
        else console.error('❌ Delete Failed');

    } else {
        console.error('❌ Test question not found');
    }
}

verifyAdmin().catch(console.error);
