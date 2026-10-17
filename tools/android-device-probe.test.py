import runpy, subprocess, unittest
from pathlib import Path
from unittest.mock import patch

SCRIPT=Path(__file__).with_name('android-device-probe.py')
class FreshCapture(unittest.TestCase):
    def test_failed_dump_never_reads_stale_xml_even_with_zero_exit(self):
        calls=[]
        def fake(args,**kwargs):
            calls.append(args)
            if 'screencap' in args:return subprocess.CompletedProcess(args,0,stdout=b'\x89PNGtest',stderr=b'')
            if 'uiautomator' in args:return subprocess.CompletedProcess(args,0,stdout='ERROR: null root node returned by UiTestAutomationBridge.',stderr='')
            return subprocess.CompletedProcess(args,0,stdout=b'<hierarchy>stale</hierarchy>')
        with patch('sys.argv',[str(SCRIPT),'capture','regression']),patch('subprocess.run',side_effect=fake),patch.object(Path,'write_bytes'):
            with self.assertRaises(RuntimeError):runpy.run_path(str(SCRIPT),run_name='__main__')
        self.assertFalse(any('cat' in c for c in calls),'Failed dump must never fetch prior device XML')
    def test_success_reads_the_new_dump_only(self):
        dumped=[];read=[]
        def fake(args,**kwargs):
            if 'screencap' in args:return subprocess.CompletedProcess(args,0,stdout=b'\x89PNGtest',stderr=b'')
            if 'uiautomator' in args:
                dumped.append(args[-1]);return subprocess.CompletedProcess(args,0,stdout='UI hierchary dumped to: '+args[-1],stderr='')
            read.append(args[-1]);return subprocess.CompletedProcess(args,0,stdout=b'<hierarchy/>')
        with patch('sys.argv',[str(SCRIPT),'capture','regression']),patch('subprocess.run',side_effect=fake),patch.object(Path,'write_bytes'):
            runpy.run_path(str(SCRIPT),run_name='__main__')
        self.assertEqual(read,dumped)
        self.assertEqual(len(read),1)
if __name__=='__main__':unittest.main()
