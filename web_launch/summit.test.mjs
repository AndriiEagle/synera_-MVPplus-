import test from 'node:test';
import assert from 'node:assert/strict';
import { summitExample } from './summit.mjs';
import { meetingDirectionsUrl } from './live-location.mjs';

test('summit demo runs the real bilateral matcher, including a negative example', () => {
  for (const asOf of ['2026-10-01','2027-01-20']) {
    const good=summitExample({asOf});
    assert.equal(good.status,'review_candidate');
    assert.equal(good.benefits.length,2);
    assert.equal(good.disclosureAllowed,false);
    assert.equal(good.binding,false);
    const bad=summitExample({asOf,need:'finance'});
    assert.notEqual(bad.status,'review_candidate');
    assert.deepEqual(bad.benefits,[]);
  }
});
test('directions encode the chosen destination, with no captured origin and no country substitution',()=>{
  const destination='Brandenburg Gate, Berlin & Mitte, Germany';
  const url=new URL(meetingDirectionsUrl(destination));
  assert.equal(url.origin,'https://www.google.com');
  assert.equal(url.pathname,'/maps/dir/');
  assert.equal(url.searchParams.get('destination'),destination);
  assert.equal(url.searchParams.get('travelmode'),'walking');
  assert.equal(url.searchParams.get('api'),'1');
  assert.equal(url.searchParams.has('origin'),false);
  assert.equal(url.searchParams.has('key'),false);
  for(const place of ['', '  ', null, 'Online', 'Онлайн']) assert.equal(meetingDirectionsUrl(place),null);
});
