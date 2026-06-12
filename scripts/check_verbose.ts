
async function check() {
    console.log('--- START CHECK ---');
    try {
        const res = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@kifahbiology.com', password: 'admin123' })
        });
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Body:', text);

        if (res.ok) {
            const json = JSON.parse(text);
            console.log('Role:', json.user.role);
        }
    } catch (err) {
        console.error('Network Error:', err);
    }
    console.log('--- END CHECK ---');
}
check();
