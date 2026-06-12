
async function checkAdminRole() {
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@kifahbiology.com', password: 'admin123' })
    });

    const data = await loginRes.json();
    if (data.user && data.user.role === 'admin') {
        console.log('✅ VERIFIED: User has ADMIN role.');
        console.log('Token received:', data.token.substring(0, 20) + '...');
    } else {
        console.error('❌ FAILED: User role is', data.user?.role);
        process.exit(1);
    }
}

checkAdminRole().catch(e => {
    console.error(e);
    process.exit(1);
});
