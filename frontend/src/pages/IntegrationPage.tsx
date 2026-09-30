import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

function CodeBlock({ title, code, lang, delay }: { title: string; code: string; lang?: string; delay: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Copied');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card overflow-hidden animate-fade-in-up" style={{ animationDelay: delay }}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-surface-400">{title}</span>
          {lang && (
            <span className="badge-gray text-[10px] py-0 px-1.5">{lang}</span>
          )}
        </div>
        <button onClick={copy} className="text-surface-500 hover:text-white flex items-center gap-1.5 text-xs transition-colors">
          {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[12.5px] leading-relaxed font-mono text-surface-300">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const loginCode = `POST /api/auth/login

{
  "license": "XXXX-XXXX-XXXX-XXXX",
  "hwid": "SEU_HWID_AQUI",
  "app_id": "app_xxxxxxxxxx"
}

Resposta (200):
{
  "success": true,
  "message": "Authenticated",
  "expires_at": "2026-10-12T00:00:00Z",
  "remaining_time": 2592000,
  "session_token": "token_aqui"
}`;

const validateCode = `POST /api/auth/validate

{
  "license": "XXXX-XXXX-XXXX-XXXX",
  "hwid": "SEU_HWID_AQUI"
}

Resposta (200):
{
  "success": true,
  "valid": true,
  "expires_at": "2026-10-12T00:00:00Z",
  "plan": "default"
}`;

const logoutCode = `POST /api/auth/logout

{
  "session_token": "token_recebido_no_login"
}`;

const cppCode = `#include <iostream>
#include <string>
#include <cstdio>
#include <curl/curl.h>

static size_t WriteCallback(void* contents, size_t size, size_t nmemb, std::string* out) {
    out->append((char*)contents, size * nmemb);
    return size * nmemb;
}

// HWID capturado automaticamente da maquina (UUID via WMI)
std::string GetHWID() {
    char buffer[128];
    std::string hwid = "";
    FILE* pipe = _popen("powershell -NoProfile -Command \\"(Get-WmiObject Win32_ComputerSystemProduct).UUID\\"", "r");
    if (pipe) {
        while (fgets(buffer, sizeof(buffer), pipe)) hwid += buffer;
        _pclose(pipe);
        while (!hwid.empty() && (hwid.back() == '\\n' || hwid.back() == '\\r')) hwid.pop_back();
    }
    return hwid;
}

int main() {
    CURL* curl = curl_easy_init();
    std::string response;

    std::string license = "XXXX-XXXX-XXXX-XXXX";
    std::string app_id = "app_xxxxxxxxxx";
    std::string hwid = GetHWID(); // puxado sozinho, igual keyauth

    std::string json = "{\\"license\\":\\"" + license +
                       "\\",\\"hwid\\":\\"" + hwid +
                       "\\",\\"app_id\\":\\"" + app_id + "\\"}";

    curl_easy_setopt(curl, CURLOPT_URL, "https://SEU-SERVICO.on.shardcloud.com/api/auth/login");
    curl_easy_setopt(curl, CURLOPT_POST, 1L);
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, json.c_str());
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);

    struct curl_slist* headers = NULL;
    headers = curl_slist_append(headers, "Content-Type: application/json");
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);

    curl_easy_perform(curl);

    if (response.find("\\"success\\": true") != std::string::npos)
        std::cout << "Liberado!" << std::endl;
    else
        std::cout << "Negado: " << response << std::endl;

    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);
    return 0;
}`;

const hwidPython = `import subprocess

result = subprocess.check_output('wmic csproduct get uuid', shell=True)
hwid = result.decode().split('\\n')[1].strip()
print(hwid)`;

const hwidCsharp = `var searcher = new ManagementObjectSearcher("SELECT UUID FROM Win32_ComputerSystemProduct");
foreach (var obj in searcher.Get()) {
    hwid = obj["UUID"].ToString();
}`;

const hwidCpp = `// HWID via WMI (PowerShell + _popen)
char buffer[128];
std::string hwid = "";
FILE* pipe = _popen("powershell -Command \\"(Get-WmiObject Win32_ComputerSystemProduct).UUID\\"", "r");
if (pipe) {
    while (fgets(buffer, 128, pipe)) hwid += buffer;
    _pclose(pipe);
    while (!hwid.empty() && (hwid.back() == '\\n' || hwid.back() == '\\r')) hwid.pop_back();
}`;

const errors = [
  { code: 'INVALID_LICENSE', msg: 'Key não existe no sistema' },
  { code: 'LICENSE_EXPIRED', msg: 'Key expirou' },
  { code: 'LICENSE_BANNED', msg: 'Key bloqueada pelo admin' },
  { code: 'LICENSE_DISABLED', msg: 'Key desativada' },
  { code: 'HWID_MISMATCH', msg: 'HWID diferente do vinculado à key' },
  { code: 'INVALID_APPLICATION', msg: 'app_id inválido ou aplicação inativa' },
];

const tabs = [
  { id: 'endpoints', label: 'Endpoints' },
  { id: 'cpp', label: 'C++ Client' },
  { id: 'hwid', label: 'Como pegar HWID' },
  { id: 'errors', label: 'Erros' },
];

export default function IntegrationPage() {
  const [tab, setTab] = useState('endpoints');

  const activeTab = tabs.find((t) => t.id === tab)!;

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-xl font-bold text-white">Integration</h1>
        <p className="text-sm text-surface-400 mt-1">Códigos pra conectar seu software na API</p>
      </div>

      <div className="pill-nav flex-wrap animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`pill ${tab === t.id ? 'pill-active' : ''}`}
          >
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'endpoints' && (
        <div className="space-y-4">
          <CodeBlock title="POST /api/auth/login · Autentica uma key" code={loginCode} lang="JSON" delay="0.05s" />
          <CodeBlock title="POST /api/auth/validate · Valida sessão ativa" code={validateCode} lang="JSON" delay="0.1s" />
          <CodeBlock title="POST /api/auth/logout · Encerra sessão" code={logoutCode} lang="JSON" delay="0.15s" />
          <p className="text-sm text-surface-400 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Fluxo: no login você recebe o <code className="font-mono text-surface-300 bg-white/5 px-1.5 py-0.5 rounded">session_token</code> →
            salva ele e chama <code className="font-mono text-surface-300 bg-white/5 px-1.5 py-0.5 rounded">/validate</code> periodicamente (ex: a cada 5 min) →
            chama <code className="font-mono text-surface-300 bg-white/5 px-1.5 py-0.5 rounded">/logout</code> ao fechar.
          </p>
        </div>
      )}

      {tab === 'cpp' && (
        <div className="space-y-4">
          <CodeBlock title="login.cpp · Cliente C++ com libcurl" code={cppCode} lang="C++" delay="0.05s" />
          <div className="card p-5 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-sm font-medium text-surface-300 mb-3">Compilar</h3>
            <p className="font-mono text-[12.5px] text-brand-300 bg-white/5 border border-white/5 rounded-lg px-3 py-2.5 inline-block">
              g++ -o meu_programa login.cpp -lcurl
            </p>
            <p className="text-xs text-surface-500 mt-3 leading-relaxed">
              No Visual Studio: adicione <code className="font-mono bg-white/5 px-1 py-0.5 rounded">curl</code> via vcpkg
              (<code className="font-mono bg-white/5 px-1 py-0.5 rounded">vcpkg install curl:x64-windows</code>) e linke
              <code className="font-mono bg-white/5 px-1 py-0.5 rounded">libcurl.lib</code>.
              Troque a URL pelo domínio real da sua API (HTTPS).
            </p>
          </div>
        </div>
      )}

      {tab === 'hwid' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CodeBlock title="Python" code={hwidPython} lang="Python" delay="0.05s" />
          <CodeBlock title="C#" code={hwidCsharp} lang="C#" delay="0.1s" />
          <div className="lg:col-span-2">
            <CodeBlock title="C++ (via WMI)" code={hwidCpp} lang="C++" delay="0.15s" />
          </div>
          <p className="lg:col-span-2 text-sm text-surface-400 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            O HWID não precisa ser o UUID do WMI — pode ser qualquer combinação estável do hardware
            (CPU ID, serial do disco, etc). O importante é ser único e estável por máquina.
          </p>
        </div>
      )}

      {tab === 'errors' && (
        <div className="card overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left">
                  <th className="px-4 py-3 text-surface-400 font-medium">Código</th>
                  <th className="px-4 py-3 text-surface-400 font-medium">Significado</th>
                </tr>
              </thead>
              <tbody>
                {errors.map((e, i) => (
                  <tr key={e.code} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-white">{e.code}</td>
                    <td className="px-4 py-3 text-surface-300 text-[13px]">{e.msg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}