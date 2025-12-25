import { supabase } from './lib/supabase';
import type { Institution, Source } from './types';

const colleges = [
  {
    name: 'National Law School of India University (NLSIU)',
    city: 'Bangalore',
    state: 'Karnataka',
    website: 'https://www.nls.ac.in',
    selector: '.job-title',
  },
  {
    name: 'National Law University, Delhi',
    city: 'Delhi',
    state: 'Delhi',
    website: 'https://www.nludelhi.ac.in',
    selector: 'a.vacancy',
  },
  {
    name: 'Gujarat National Law University',
    city: 'Gandhinagar',
    state: 'Gujarat',
    website: 'https://www.gnlu.ac.in',
    selector: '.news-title',
  },
  {
    name: 'National Law University, Jodhpur',
    city: 'Jodhpur',
    state: 'Rajasthan',
    website: 'https://www.nlujodhpur.ac.in',
    selector: '.post-title',
  },
  {
    name: 'West Bengal National University of Juridical Sciences',
    city: 'Kolkata',
    state: 'West Bengal',
    website: 'https://www.wbnujs.ac.in',
    selector: 'h3.opening',
  },
  {
    name: 'Rajiv Gandhi School of Intellectual Property Law',
    city: 'Kharagpur',
    state: 'West Bengal',
    website: 'https://www.iitkgp.ac.in/rgsipl',
    selector: '.job-opening',
  },
  {
    name: 'Tamil Nadu Dr. Ambedkar Law University',
    city: 'Chennai',
    state: 'Tamil Nadu',
    website: 'https://www.tndalu.ac.in',
    selector: '.vacancy-item',
  },
  {
    name: 'National Institutes of Technology and Science Law University',
    city: 'Mumbai',
    state: 'Maharashtra',
    website: 'https://www.nmims.edu',
    selector: '.job-listing',
  },
  {
    name: 'National Law University, Assam',
    city: 'Guwahati',
    state: 'Assam',
    website: 'https://www.nluassam.ac.in',
    selector: '.notification',
  },
  {
    name: 'National Law University, Odisha',
    city: 'Cuttack',
    state: 'Odisha',
    website: 'https://www.nluodisha.ac.in',
    selector: '.news-item',
  },
  {
    name: 'School of Law, KIIT University',
    city: 'Bhubaneswar',
    state: 'Odisha',
    website: 'https://www.kiit.ac.in/law',
    selector: '.job-post',
  },
  {
    name: 'National Law University, Ranchi',
    city: 'Ranchi',
    state: 'Jharkhand',
    website: 'https://www.nlur.ac.in',
    selector: '.opening',
  },
  {
    name: 'Gujarat University Faculty of Law',
    city: 'Ahmedabad',
    state: 'Gujarat',
    website: 'https://gujaratuniversity.ac.in',
    selector: '.announcement',
  },
  {
    name: 'University of Delhi, Law Faculty',
    city: 'Delhi',
    state: 'Delhi',
    website: 'https://www.du.ac.in/law',
    selector: '.notice-item',
  },
  {
    name: 'Symbiosis Law School',
    city: 'Pune',
    state: 'Maharashtra',
    website: 'https://www.symbiosis.ac.in/sls',
    selector: '.vacancy',
  },
  {
    name: 'Jindal Global Law School',
    city: 'Sonipat',
    state: 'Haryana',
    website: 'https://www.jgls.ac.in',
    selector: '.job-opening',
  },
  {
    name: 'Nirma University, Institute of Law',
    city: 'Ahmedabad',
    state: 'Gujarat',
    website: 'https://www.nirmauni.ac.in',
    selector: '.opening',
  },
  {
    name: 'Savitribai Phule Pune University Law College',
    city: 'Pune',
    state: 'Maharashtra',
    website: 'https://www.unipune.ac.in',
    selector: '.news',
  },
  {
    name: 'Banaras Hindu University Law School',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    website: 'https://www.bhu.ac.in',
    selector: '.job-title',
  },
  {
    name: 'University of Lucknow Law Faculty',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    website: 'https://www.lkouniv.ac.in',
    selector: '.notification',
  },
];

async function bootstrap() {
  try {
    console.log('Starting bootstrap process...');

    // Insert institutions
    const institutionIds: Record<string, string> = {};
    for (const college of colleges) {
      const { data, error } = await supabase
        .from('institutions')
        .insert([college])
        .select('id')
        .single();

      if (error) {
        console.error(`Error inserting ${college.name}:`, error);
        continue;
      }

      institutionIds[college.name] = data.id;
      console.log(`✓ Created institution: ${college.name}`);
    }

    // Create sources for each institution
    const sources: Source[] = Object.entries(institutionIds).map(
      ([name, institutionId]) => ({
        institution_id: institutionId,
        url: colleges.find((c) => c.name === name)!.website + '/careers',
        selector: colleges.find((c) => c.name === name)!.selector,
        is_active: true,
      })
    );

    const { error: sourceError } = await supabase
      .from('sources')
      .insert(sources);

    if (sourceError) {
      console.error('Error inserting sources:', sourceError);
    } else {
      console.log(`✓ Created ${sources.length} sources`);
    }

    console.log('✓ Bootstrap completed successfully!');
  } catch (error) {
    console.error('Bootstrap error:', error);
    process.exit(1);
  }
}

bootstrap();
