const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Basic env parser
const env = fs.readFileSync(path.resolve(__dirname, '../.env.local'), 'utf-8');
const envVars = {};
env.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val) envVars[key.trim()] = val.join('=').trim();
});

const supabase = createClient(
    envVars['NEXT_PUBLIC_SUPABASE_URL'],
    envVars['SUPABASE_SERVICE_ROLE_KEY']
);

async function seed() {
    console.log('Starting manual seed...');

    const users = [
        { email: 'sadik5780@gmail.com', password: 'password123', role: 'superadmin', name: 'System Admin' },
        { email: 'dr.steve@ortho.com', password: 'password123', role: 'doctor', name: 'Dr. Steve Rogers', specialization: 'Orthopedic Surgeon', reg: 'Ortho-001' },
        { email: 'nurse.sarah@ortho.com', password: 'password123', role: 'assistant', name: 'Sarah Connor', assigned_email: 'dr.steve@ortho.com' }
    ];

    for (const u of users) {
        console.log(`Processing ${u.email}...`);

        // 1. Create or Get Auth User
        // admin.createUser throws if email exists, so we try getUserById or just try catch
        // But we don't know ID. listUsers is an option but might be paginated.
        // Easiest is to try create, if fail, assume exists.

        let userId;

        const { data: created, error: createError } = await supabase.auth.admin.createUser({
            email: u.email,
            password: u.password,
            email_confirm: true,
            user_metadata: { role: u.role }
        });

        if (createError) {
            console.log(`User creation note: ${createError.message}`);
            // If exists, we can't easily get the ID without listing.
            // Let's list users to find this one.
            const { data: listData } = await supabase.auth.admin.listUsers();
            const existingUser = listData.users.find(x => x.email === u.email);
            if (existingUser) {
                userId = existingUser.id;
                console.log(`Found existing user ID: ${userId}`);
                // Update password to be sure
                await supabase.auth.admin.updateUserById(userId, { password: u.password });
            } else {
                console.error('Could not create or find user');
                continue;
            }
        } else {
            userId = created.user.id;
            console.log(`Created new user ID: ${userId}`);
        }

        // 2. Upsert Profile
        const { error: profileError } = await supabase.from('profiles').upsert({
            id: userId,
            email: u.email,
            role: u.role,
            full_name: u.name,
            is_active: true
        });

        if (profileError) {
            console.error('Profile upsert failed:', profileError.message);
        } else {
            console.log('Profile upserted.');
        }

        // 3. Role specific
        if (u.role === 'doctor') {
            // Check if doctor record exists
            const { data: doc, error: docErr } = await supabase.from('doctors').select('id').eq('profile_id', userId).single();
            if (!doc) {
                await supabase.from('doctors').insert({
                    profile_id: userId,
                    specialization: u.specialization,
                    registration_number: u.reg
                });
                console.log('Doctor record created.');
            } else {
                console.log('Doctor record exists.');
            }
        } else if (u.role === 'assistant') {
            // Check assistant
            const { data: asst } = await supabase.from('assistants').select('id').eq('profile_id', userId).single();
            if (!asst) {
                // Fetch assigned doctor
                const { data: drUser } = await supabase.from('profiles').select('id').eq('email', u.assigned_email).single();
                if (drUser) {
                    const { data: drRecord } = await supabase.from('doctors').select('id').eq('profile_id', drUser.id).single();
                    if (drRecord) {
                        await supabase.from('assistants').insert({
                            profile_id: userId,
                            assigned_doctor_id: drRecord.id
                        });
                        console.log('Assistant record created.');
                    }
                }
            } else {
                console.log('Assistant record exists.');
            }
        }
    }
    console.log('Seeding complete.');
}

seed().catch(err => console.error(err));
