"""Negative tests for the omissions that caused the incomplete handoff."""
import copy
import unittest
from check_context import load, validate


class Coverage(unittest.TestCase):
    def setUp(self):
        self.args = [load('CONTEXT.json'), load('archive/PRODUCT_SPEC.json'), load('INSIGHTS.json'), load('archive/CLAIM_DISPOSITIONS.json')]

    def test_complete_bound_context(self):
        validate(*self.args)

    def test_missing_requirement_or_changed_acceptance_rejected(self):
        for mutate in [lambda d:d['requirements'].pop(), lambda d:d['requirements'][0].update(acceptance='Generic profile support')]:
            args=copy.deepcopy(self.args);mutate(args[0])
            with self.assertRaises(ValueError):validate(*args)

    def test_lost_map_or_unbound_source_rejected(self):
        for mutate in [lambda d:d.update(preservation_inventory=[f for f in d['preservation_inventory'] if f['id']!='LEGACY_MAP']),lambda d:d['requirements'][0].update(source_id='missing')]:
            args=copy.deepcopy(self.args);mutate(args[0])
            with self.assertRaises(ValueError):validate(*args)

    def test_archived_facts_and_silent_dispatch_rejected(self):
        args=copy.deepcopy(self.args);args[3]['current_external_verification']=True
        with self.assertRaises(ValueError):validate(*args)
        args=copy.deepcopy(self.args);args[0]['geo_requirement']['v6_task_added']=True
        with self.assertRaises(ValueError):validate(*args)

    def test_missing_source_decision_rejected(self):
        args=copy.deepcopy(self.args);args[2]['items'].pop()
        with self.assertRaises(ValueError):validate(*args)


if __name__=='__main__':unittest.main()
