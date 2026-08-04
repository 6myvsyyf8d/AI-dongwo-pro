/**
 * batch-import.js — 批量导入模块
 * 挂载：window.BatchImport
 * 支持 CSV 文件上传解析 → 预览确认 → 批量写入记录
 * 依赖：window.DataStore, window.Utils, window.Constants
 */
(function () {
  'use strict';

  var DS = window.DataStore;
  var U = window.Utils;
  var C = window.Constants;

  var parsedRows = [];

  /* ==========================================================
   * CSV 模板下载
   * ========================================================== */

  var CSV_TEMPLATE = [
    'date,time,type,module,title,content,tags,mood,author,authorRole',
    '2025-01-15,09:00,mood,life,今天心情不错,记录今天的状态,开心,开心,测试用户,parent',
    '2025-01-15,14:30,activity,activity,烘焙练习,动手制作曲奇饼干,烘焙,,' + '某用户' + ',teacher',
    '2025-01-16,10:00,emotion,emotion,情绪波动,在嘈杂环境中感到焦虑,焦虑,焦虑,某用户,caregiver'
  ].join('\n');

  function downloadTemplate() {
    var BOM = '\uFEFF';
    var blob = new Blob([BOM + CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'AI懂我-批量导入模板.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* ==========================================================
   * 渲染导入界面
   * ========================================================== */

  function render(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    parsedRows = [];

    container.innerHTML =
      '<div style="padding:16px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">' +
          '<h3 style="margin:0;font-size:1.1rem;">📥 CSV 批量导入</h3>' +
          '<button class="btn btn-outline" id="btn-download-template" style="padding:6px 14px;font-size:0.82rem;">📄 下载模板</button>' +
        '</div>' +

        '<div style="background:#f9fafb;border:2px dashed #d0d5dd;border-radius:12px;padding:32px;text-align:center;margin-bottom:16px;" id="drop-zone">' +
          '<div style="font-size:2.5rem;margin-bottom:8px;">📁</div>' +
          '<div style="color:#666;margin-bottom:8px;">拖拽 CSV 文件到此处，或点击选择</div>' +
          '<input type="file" id="csv-file-input" accept=".csv" style="display:none;">' +
          '<button class="btn btn-primary" id="btn-select-file" style="padding:8px 20px;font-size:0.9rem;">选择文件</button>' +
          '<div id="file-name-display" style="margin-top:8px;color:#4A90D9;font-weight:500;"></div>' +
          '<div id="parse-error-display" style="margin-top:8px;color:#F5222D;font-size:0.85rem;"></div>' +
        '</div>' +

        '<div id="csv-preview-area" style="display:none;"></div>' +

        '<div id="import-result-area" style="display:none;"></div>' +
      '</div>';

    bindEvents();
  }

  function bindEvents() {
    var dropZone = document.getElementById('drop-zone');
    var fileInput = document.getElementById('csv-file-input');
    var selectBtn = document.getElementById('btn-select-file');
    var templateBtn = document.getElementById('btn-download-template');

    if (selectBtn) {
      selectBtn.addEventListener('click', function () { fileInput.click(); });
    }

    if (templateBtn) {
      templateBtn.addEventListener('click', function (e) {
        e.preventDefault();
        downloadTemplate();
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', function (e) {
        if (e.target.files && e.target.files[0]) {
          handleFile(e.target.files[0]);
        }
      });
    }

    if (dropZone) {
      dropZone.addEventListener('dragover', function (e) {
        e.preventDefault();
        dropZone.style.borderColor = '#4A90D9';
        dropZone.style.background = '#f0f5ff';
      });
      dropZone.addEventListener('dragleave', function () {
        dropZone.style.borderColor = '#d0d5dd';
        dropZone.style.background = '#f9fafb';
      });
      dropZone.addEventListener('drop', function (e) {
        e.preventDefault();
        dropZone.style.borderColor = '#d0d5dd';
        dropZone.style.background = '#f9fafb';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleFile(e.dataTransfer.files[0]);
        }
      });
    }
  }

  /* ==========================================================
   * 文件解析
   * ========================================================== */

  function handleFile(file) {
    var nameDisplay = document.getElementById('file-name-display');
    var errorDisplay = document.getElementById('parse-error-display');
    var previewArea = document.getElementById('csv-preview-area');
    var importResult = document.getElementById('import-result-area');

    if (nameDisplay) nameDisplay.textContent = '📎 ' + file.name;
    if (errorDisplay) errorDisplay.textContent = '';
    if (importResult) importResult.style.display = 'none';

    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        parsedRows = parseCSV(e.target.result);
        if (parsedRows.length === 0) {
          if (errorDisplay) errorDisplay.textContent = 'CSV 文件为空或格式不正确';
          return;
        }
        renderPreview(parsedRows);
      } catch (err) {
        if (errorDisplay) errorDisplay.textContent = '解析失败：' + err.message;
        console.error('CSV解析失败:', err);
      }
    };
    reader.onerror = function () {
      if (errorDisplay) errorDisplay.textContent = '文件读取失败，请重试';
    };
    reader.readAsText(file, 'UTF-8');
  }

  function parseCSV(text) {
    var lines = text.replace(/\r/g, '').split('\n').filter(function (l) { return l.trim(); });
    if (lines.length < 2) return [];

    var headers = lines[0].split(',').map(function (h) { return h.trim().toLowerCase(); });
    var rows = [];

    for (var i = 1; i < lines.length; i++) {
      var cols = parseCSVLine(lines[i]);
      if (cols.length === 0) continue;

      var row = {};
      headers.forEach(function (h, idx) {
        row[h] = idx < cols.length ? cols[idx].trim() : '';
      });

      // 验证必填字段
      if (!row.date || !row.type) {
        console.error('第 ' + (i + 1) + ' 行缺少必填字段（date/type），已跳过');
        continue;
      }

      rows.push({
        date: row.date,
        time: row.time || '',
        type: row.type,
        module: row.module || row.type,
        title: row.title || '',
        content: row.content || '',
        tags: row.tags ? row.tags.split(/[,;，；]/).map(function (t) { return t.trim(); }).filter(Boolean) : [],
        mood: row.mood || '',
        author: row.author || '导入用户',
        authorRole: row.authorrole || row.authorRole || 'admin',
        authorAvatar: row.authorrole ? getRoleAvatar(row.authorrole || row.authorRole) : '📥'
      });
    }

    return rows;
  }

  function parseCSVLine(line) {
    var result = [];
    var current = '';
    var inQuotes = false;

    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (ch === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  }

  function getRoleAvatar(roleKey) {
    var map = { youth: '🌻', parent: '👨‍👩‍👧', teacher: '📚', caregiver: '🤝', government: '🏛️', admin: '🛡️' };
    return map[roleKey] || '👤';
  }

  /* ==========================================================
   * 预览确认
   * ========================================================== */

  function renderPreview(rows) {
    var previewArea = document.getElementById('csv-preview-area');
    if (!previewArea) return;
    previewArea.style.display = 'block';

    var typeCounts = {};
    rows.forEach(function (r) {
      typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
    });
    var typeSummary = Object.keys(typeCounts).map(function (k) {
      return (C.RECORD_TYPES && C.RECORD_TYPES[k] ? C.RECORD_TYPES[k].label : k) + ' × ' + typeCounts[k];
    }).join(' · ');

    var html = '';
    html += '<div style="background:#f6ffed;border:1px solid #b7eb8f;border-radius:8px;padding:12px 16px;margin-bottom:12px;display:flex;align-items:center;gap:8px;">';
    html += '<span style="font-size:1.2rem;">✅</span>';
    html += '<span>已解析 <b>' + rows.length + '</b> 条记录（' + typeSummary + '）</span>';
    html += '</div>';

    html += '<div style="max-height:300px;overflow-y:auto;border:1px solid #f0f0f0;border-radius:8px;margin-bottom:16px;">';
    html += '<table style="width:100%;font-size:0.78rem;border-collapse:collapse;">';
    html += '<thead><tr style="background:#fafafa;position:sticky;top:0;">';
    html += '<th style="padding:8px;text-align:left;">日期</th>';
    html += '<th style="padding:8px;text-align:left;">类型</th>';
    html += '<th style="padding:8px;text-align:left;">标题</th>';
    html += '<th style="padding:8px;text-align:left;">内容</th>';
    html += '<th style="padding:8px;text-align:left;">标签</th>';
    html += '</tr></thead><tbody>';

    var displayRows = rows.slice(0, 20);
    displayRows.forEach(function (r) {
      var typeLabel = (C.RECORD_TYPES && C.RECORD_TYPES[r.type]) ? C.RECORD_TYPES[r.type].label : r.type;
      html += '<tr style="border-bottom:1px solid #f5f5f5;">';
      html += '<td style="padding:8px;">' + r.date + '</td>';
      html += '<td style="padding:8px;">' + typeLabel + '</td>';
      html += '<td style="padding:8px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (r.title || '-') + '</td>';
      html += '<td style="padding:8px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (r.content || '-') + '</td>';
      html += '<td style="padding:8px;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (r.tags || []).join(', ') + '</td>';
      html += '</tr>';
    });

    if (rows.length > 20) {
      html += '<tr><td colspan="5" style="text-align:center;padding:12px;color:#999;">... 还有 ' + (rows.length - 20) + ' 条记录未显示</td></tr>';
    }

    html += '</tbody></table></div>';

    html += '<div style="display:flex;gap:12px;align-items:center;">';
    html += '<button class="btn btn-primary" id="btn-confirm-import" style="padding:10px 24px;font-size:0.95rem;">✅ 确认导入 ' + rows.length + ' 条</button>';
    html += '<button class="btn btn-outline" id="btn-cancel-import" style="padding:10px 24px;font-size:0.95rem;">取消</button>';
    html += '</div>';

    previewArea.innerHTML = html;

    // 绑定确认/取消
    var confirmBtn = document.getElementById('btn-confirm-import');
    var cancelBtn = document.getElementById('btn-cancel-import');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', function () {
        executeImport(rows);
      });
    }
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        parsedRows = [];
        if (previewArea) previewArea.style.display = 'none';
        var nameDisplay = document.getElementById('file-name-display');
        if (nameDisplay) nameDisplay.textContent = '';
        var fileInput = document.getElementById('csv-file-input');
        if (fileInput) fileInput.value = '';
      });
    }
  }

  /* ==========================================================
   * 执行导入
   * ========================================================== */

  function executeImport(rows) {
    var importResult = document.getElementById('import-result-area');
    var previewArea = document.getElementById('csv-preview-area');

    var successCount = 0;
    var failCount = 0;
    var errors = [];

    rows.forEach(function (row) {
      try {
        var record = {
          id: 'imp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
          date: row.date,
          time: row.time,
          type: row.type,
          module: row.module,
          title: row.title,
          content: row.content,
          tags: row.tags,
          mood: row.mood || undefined,
          author: row.author,
          authorRole: row.authorRole,
          authorAvatar: row.authorAvatar,
          createdAt: U.date.nowISO ? U.date.nowISO() : new Date().toISOString()
        };

        if (DS.addRecord) {
          DS.addRecord(record);
        }
        successCount++;
      } catch (e) {
        failCount++;
        errors.push('第 ' + (successCount + failCount) + ' 条: ' + e.message);
      }
    });

    // 显示结果
    if (importResult) {
      importResult.style.display = 'block';
      var resultHTML = '<div style="background:#f6ffed;border:1px solid #b7eb8f;border-radius:8px;padding:16px;">';
      resultHTML += '<div style="font-size:1.1rem;font-weight:600;color:#52C41A;margin-bottom:8px;">✅ 导入完成</div>';
      resultHTML += '<div>成功导入 <b>' + successCount + '</b> 条记录';
      if (failCount > 0) {
        resultHTML += '，<span style="color:#F5222D;">失败 ' + failCount + ' 条</span>';
      }
      resultHTML += '</div>';
      if (errors.length > 0) {
        resultHTML += '<div style="margin-top:8px;font-size:0.8rem;color:#F5222D;">' + errors.join('<br>') + '</div>';
      }
      resultHTML += '</div>';
      importResult.innerHTML = resultHTML;
    }

    if (previewArea) previewArea.style.display = 'none';
    parsedRows = [];

    // 清除文件名
    var nameDisplay = document.getElementById('file-name-display');
    if (nameDisplay) nameDisplay.textContent = '';
    var fileInput = document.getElementById('csv-file-input');
    if (fileInput) fileInput.value = '';

    // 提示刷新
    setTimeout(function () {
      if (importResult) importResult.style.display = 'none';
    }, 5000);
  }

  /* ==========================================================
   * 公开 API
   * ========================================================== */

  window.BatchImport = {
    render: render,
    downloadTemplate: downloadTemplate
  };

})();
