import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const facultyfinderUrl = process.env.FACULTYFINDER_URL || '';
const facultyfinderKey = process.env.FACULTYFINDER_KEY || '';

const lawJobsDb = createClient(supabaseUrl, supabaseKey);
const facultyFinderDb = createClient(facultyfinderUrl, facultyfinderKey);

async function syncCollegesFromFacultyFinder() {
  console.log('Starting FacultyFinder college sync...');
  
  try {
    // Fetch all colleges from FacultyFinder
    const { data: facultyFinderColleges, error: fetchError } = await facultyFinderDb
      .from('colleges')
      .select('*')
      .eq('active', true);

    if (fetchError) throw fetchError;
    
    if (!facultyFinderColleges || facultyFinderColleges.length === 0) {
      console.log('No colleges found in FacultyFinder');
      return;
    }

    console.log(`Found ${facultyFinderColleges.length} colleges`);

    // Fetch existing institutions
    const { data: existingInstitutions } = await lawJobsDb
      .from('institutions')
      .select('external_id');

    const existingIds = new Set(existingInstitutions?.map(i => i.external_id) || []);

    let insertedCount = 0;
    let skippedCount = 0;

    // Sync colleges
    for (const college of facultyFinderColleges) {
      const externalId = `ff_${college.id}`;
      
      if (existingIds.has(externalId)) {
        skippedCount++;
        continue;
      }

      try {
        const { error: insertError } = await lawJobsDb
          .from('institutions')
          .insert({
            name: college.name || '',
            city: college.city || '',
            state: college.state || '',
            website: college.website || null,
            external_id: externalId,
            active: true,
          });

        if (insertError) {
          console.error(`Failed to insert ${college.name}:`, insertError);
          skippedCount++;
        } else {
          insertedCount++;
        }
      } catch (err) {
        console.error(`Error processing ${college.name}:`, err);
        skippedCount++;
      }
    }

    // Log sync status
    const { error: logError } = await lawJobsDb
      .from('sync_log')
      .insert({
        source: 'facultyfinder',
        sync_count: insertedCount,
        status: 'completed',
        message: `Synced ${insertedCount}, skipped ${skippedCount}`,
      });

    if (logError) console.error('Failed to log sync:', logError);
    
    console.log(`Sync: ${insertedCount} inserted, ${skippedCount} skipped`);
  } catch (error) {
    console.error('Sync error:', error);
    process.exit(1);
  }
}

syncCollegesFromFacultyFinder().then(() => {
  console.log('Sync completed');
  process.exit(0);
});
