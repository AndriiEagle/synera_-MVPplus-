import copy
import json
import unittest
import sys
from check_workflow import HERE, check
sys.path.insert(0, 'C:/Users/Andrii/.codex/skills/agent-materializer/scripts')
from materializer import reconcile_acceptance

class WorkflowChecks(unittest.TestCase):
    def setUp(self):
        self.plan=json.loads((HERE.parent/'TASKS.json').read_text(encoding='utf-8'))
    def test_current_plan(self):
        result=check(self.plan)
        self.assertEqual(result['status'],'PLAN_STRUCTURE_PASS',result)
        self.assertFalse(result['dispatch_allowed'])
        self.assertFalse(result['product_accepted'])
    def test_rejects_cycle_missing_dependency_and_duplicate_task(self):
        for failure in ('cycle','missing','duplicate'):
            with self.subTest(failure=failure):
                p=copy.deepcopy(self.plan)
                if failure=='cycle': p['tasks'][0]['depends_on']=['V6-18']
                elif failure=='missing': p['tasks'][0]['depends_on']=['not-present']
                else: p['tasks'].append(copy.deepcopy(p['tasks'][0]))
                self.assertEqual(check(p)['status'],'HOLD')

    def test_canonical_acceptance_rejects_receipt_self_review_stale_and_conflicting_outcomes(self):
        req=[{'id':'r','revision':1,'expected':{'op':'equals','value':{'blocked':True}}}]
        good={'requirement_id':'r','revision':1,'kind':'outcome','producer':'app','observer':'independent_probe','locator':'synthetic-fixture','actual':{'blocked':True}}
        self.assertEqual(reconcile_acceptance(req,[good],current_revision=1)['status'],'PASS')
        for change in ({'kind':'action_receipt'},{'observer':'app'},{'revision':0},{'actual':{'blocked':False}}):
            with self.subTest(change=change):
                self.assertEqual(reconcile_acceptance(req,[{**good,**change}],current_revision=1)['status'],'HOLD')
        self.assertEqual(reconcile_acceptance(req,[good,{**good,'actual':{'blocked':False}}],current_revision=1)['status'],'HOLD')
    def test_rejects_budget_scope_and_incomplete_contract(self):
        for failure in ('budget','scope','contract'):
            with self.subTest(failure=failure):
                p=copy.deepcopy(self.plan)
                if failure=='budget': p['task_cap_usd']=0.51
                elif failure=='scope': p['tasks'][0]['owned_paths']=['../../escape.mjs']
                else: del p['tasks'][0]['acceptance']
                self.assertEqual(check(p)['status'],'HOLD')

if __name__=='__main__': unittest.main()
