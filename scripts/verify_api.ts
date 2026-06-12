
async function verify() {
    const BASE = 'http://localhost:3000/api';
    const email = `test_${Date.now()}@example.com`;
    const password = 'password123';
    let token = '';

    console.log('1. Registering user...');
    const regRes = await fetch(`${BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Verifier', email, password, role: 'student' })
    });

    if (!regRes.ok) {
        console.error('Registration failed:', await regRes.text());
        process.exit(1);
    }
    const regData = await regRes.json();
    console.log('✅ Registered:', regData.user.email);
    token = regData.token;

    console.log('\n2. Logging in...');
    const loginRes = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    if (!loginRes.ok) throw new Error('Login failed');
    const loginData = await loginRes.json();
    console.log('✅ Logged in, Token received');

    console.log('\n3. Fetching questions...');
    const qRes = await fetch(`${BASE}/questions`);
    const questions = await qRes.json();
    console.log(`✅ Loaded ${questions.length} weeks of questions`);

    if (questions.length > 0 && questions[0].questions.length > 0) {
        const qId = questions[0].questions[0].id; // Assuming structure
        console.log(`\n4. Submitting answer for Question ID ${qId}...`);

        const progRes = await fetch(`${BASE}/progress`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ questionId: qId, isCorrect: true, points: 10 })
        });

        if (progRes.ok) console.log('✅ Progress saved');
        else console.error('❌ Progress failed');
    }

    console.log('\n5. Verifying Score...');
    const meRes = await fetch(`${BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const me = await meRes.json();
    if (me.score === 10) console.log('✅ Score verified: 10');
    else console.error('❌ Score mismatch:', me.score);
}

verify().catch(console.error);
