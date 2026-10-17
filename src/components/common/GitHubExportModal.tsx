/**
 * GitHub Export & Code Download Modal
 * Allows users to download the full project archive or push directly to their GitHub repository.
 */

import React, { useState } from 'react';
import {
  Github,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Copy,
  Terminal,
  KeyRound,
  ShieldCheck,
  FolderArchive,
  ArrowRight,
  Sparkles,
  Database,
  FileJson
} from 'lucide-react';
import { feedback } from '../../utils/feedback';
import { StorageService } from '../../services/storage';

interface GitHubExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubExportModal: React.FC<GitHubExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [branch, setBranch] = useState('main');
  const [isPushing, setIsPushing] = useState(false);
  const [pushStatus, setPushStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!isOpen) return null;

  const handleDownloadArchive = () => {
    feedback.save('กำลังดาวน์โหลดไฟล์โปรเจกต์...', 'adventure-m1-code.tar.gz');
    window.location.href = '/api/export/download';
  };

  const handleDownloadDataJson = () => {
    StorageService.downloadDataAsJsonFile('adventure_m1_full_data.json');
    feedback.save('ดาวน์โหลดไฟล์ฐานข้อมูล JSON ทั้งหมดสำเร็จ', 'adventure_m1_full_data.json');
  };

  const handlePushToGithub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) {
      setPushStatus({ success: false, message: 'กรุณาระบุ URL ของ GitHub Repository' });
      return;
    }

    setIsPushing(true);
    setPushStatus(null);

    try {
      // Gather all application data so git captures the entire database snapshot
      const allData = StorageService.exportAllData();

      const res = await fetch('/api/github/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: repoUrl.trim(),
          token: githubToken.trim(),
          branch: branch.trim() || 'main',
          allData,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPushStatus({ success: true, message: data.message });
        feedback.add('อัปโหลดโค้ดและข้อมูลขึ้น GitHub สำเร็จ!', repoUrl);
      } else {
        setPushStatus({
          success: false,
          message: data.error || 'เกิดข้อผิดพลาดในการ Push ขึ้น GitHub',
        });
        feedback.error('Push ล้มเหลว');
      }
    } catch (err: any) {
      setPushStatus({
        success: false,
        message: err.message || 'การเชื่อมต่อขัดข้อง',
      });
      feedback.error('การเชื่อมต่อล้มเหลว');
    } finally {
      setIsPushing(false);
    }
  };

  const sampleCommands = `# 1. เชื่อมต่อ Git Remote
git remote add origin ${repoUrl.trim() || 'https://github.com/<YOUR-USERNAME>/<REPO-NAME>.git'}

# 2. นำโค้ดทั้งหมดขึ้น GitHub
git branch -M main
git push -u origin main --force`;

  const handleCopyCommands = () => {
    navigator.clipboard.writeText(sampleCommands);
    setCopiedCmd(true);
    feedback.save('คัดลอกคำสั่งเรียบร้อยแล้ว');
    setTimeout(() => setCopiedCmd(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white shadow-md">
              <Github className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-['Chakra_Petch'] flex items-center gap-2">
                <span>นำโค้ดและข้อมูลขึ้น GitHub</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  Ready to Export
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                ดาวน์โหลดไฟล์โค้ดทั้งโปรเจกต์ หรืออัปโหลดตรงเข้าสู่ GitHub Repository ของคุณ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-left">
          {/* Status Message */}
          {pushStatus && (
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 animate-fade-in ${
                pushStatus.success
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-200'
              }`}
            >
              {pushStatus.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs space-y-1">
                <p className="font-semibold">{pushStatus.message}</p>
                {pushStatus.success && repoUrl && (
                  <a
                    href={repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-300 underline hover:text-white font-bold"
                  >
                    <span>ไปที่ GitHub Repository ของคุณ →</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* EXPORT OPTIONS: Code Archive & Full Dataset JSON */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Full Code Archive (.tar.gz) */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-800/60 to-slate-900 border border-amber-500/30 flex flex-col justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FolderArchive className="w-4 h-4 text-amber-400" />
                  <h4 className="font-bold text-xs text-white font-['Chakra_Petch']">
                    ดาวน์โหลดโค้ดทั้งโปรเจกต์ (.tar.gz)
                  </h4>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  ดาวน์โหลดโค้ด 80+ ไฟล์ครบชุด (พร้อม README, Config, และทุกคอมโพเนนต์)
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadArchive}
                className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow hover:scale-102 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ดาวน์โหลดโค้ด (.tar.gz)</span>
              </button>
            </div>

            {/* 2. Full Database & Exams (.json) */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-800/60 to-slate-900 border border-emerald-500/30 flex flex-col justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <h4 className="font-bold text-xs text-white font-['Chakra_Petch']">
                    ดาวน์โหลดฐานข้อมูลทั้งหมด (.json)
                  </h4>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  คลังข้อสอบ 7 บท, นักเรียน, คะแนน, สถิติจุดผิดพลาด, และการตั้งค่าครบ 100%
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadDataJson}
                className="w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow hover:scale-102 cursor-pointer"
              >
                <FileJson className="w-3.5 h-3.5" />
                <span>ดาวน์โหลดข้อมูล (.json)</span>
              </button>
            </div>
          </div>

          {/* METHOD 2: Direct Push via Token */}
          <form onSubmit={handlePushToGithub} className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-400" />
                <h4 className="font-bold text-sm text-white font-['Chakra_Petch']">
                  อัปโหลดโค้ดและข้อมูลทั้งหมดขึ้น GitHub Repository
                </h4>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                Code + Data Included
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  1. URL ของ GitHub Repository (เช่น https://github.com/myname/adventure-m1) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/your-username/your-repo-name.git"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                  <span>2. GitHub Personal Access Token (PAT) <span className="text-slate-400">(สิทธิ์ 'repo')</span></span>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=Adventure-M1-Upload"
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-400 hover:underline flex items-center gap-1 font-normal"
                  >
                    <span>สร้าง Token บน GitHub →</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </label>
                <input
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx (สร้างจาก GitHub Settings > Developer settings > Tokens)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 font-mono text-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  💡 หากเป็น Public Repository และเครื่องของคุณ Login อยู่แล้ว สามารถใส่ URL พร้อม Token หรือกดรันคำสั่งด้านล่างได้
                </p>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={isPushing}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-transform hover:scale-105 cursor-pointer"
                >
                  {isPushing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>กำลังส่งโค้ดขึ้น GitHub...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>กดอัปโหลดขึ้น GitHub ทันที</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* METHOD 3: Copy Git Terminal Commands */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-['Chakra_Petch']">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>วิธีที่ 3: รันคำสั่งด้วย Git Terminal</span>
              </span>
              <button
                type="button"
                onClick={handleCopyCommands}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                {copiedCmd ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCmd ? 'คัดลอกแล้ว!' : 'คัดลอกคำสั่ง'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">
              {sampleCommands}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
