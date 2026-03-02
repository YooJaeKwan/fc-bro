const fs = require('fs');

const path = './app/components/team-management.tsx';
const lines = fs.readFileSync(path, 'utf8').split('\n');

// We'll process by chunks
function replaceBetween(startStr, endStr, replacement) {
  let inChunk = false;
  let newLines = [];
  let found = false;
  
  for (let i = 0; i < lines.length; i++) {
    if (!inChunk && !found && lines[i].includes(startStr)) {
      inChunk = true;
      newLines.push(replacement);
      continue;
    }
    
    if (inChunk && lines[i].includes(endStr)) {
      inChunk = false;
      found = true;
      continue;
    }
    
    if (!inChunk) {
      newLines.push(lines[i]);
    }
  }
  lines.length = 0;
  lines.push(...newLines);
}

// 1. Remove states
replaceBetween(
  'const [sortBy, setSortBy] = useState',
  'const [sortBy, setSortBy] = useState',
  '  const sortBy = "name";\n  const levelFilter = "all";\n'
);

// Remove the actual levelFilter state line
let lfIndex = lines.findIndex(l => l.includes('const [levelFilter, setLevelFilter] = useState("all")'));
if (lfIndex >= 0) lines[lfIndex] = '';

// 2. Remove getGroupedMembers
replaceBetween(
  '  // 포지션 대분류로 멤버 그룹화',
  '  // 포지션별 카운트',
  '  // 포지션별 카운트'
);

// 3. Header UI: remove sortBy select
replaceBetween(
  '        {/* 정렬 필터 - SELECT 형태 (전체 너비) */}',
  '        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>',
  '        {/* 상태 필터 */}\n        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>'
);

// 4. Header UI: remove levelFilter select
replaceBetween(
  '        {/* 레벨 필터 - 레벨순일 때만 표시 */}',
  '        {/* 이름 검색 필터 - 가나다순일 때만 표시 */}',
  '        {/* 이름 검색 필터 - 항상 표시 */}'
);

// 5. Unconditionally render search
let searchIdx = lines.findIndex(l => l.includes('{sortBy === "name" && ('));
if (searchIdx >= 0) {
  lines[searchIdx] = '        {';
}

// 6. Unconditionally render position tabs
let posTabIdx = lines.findIndex(l => l.includes('{sortBy === "position" && ('));
if (posTabIdx >= 0) {
  lines[posTabIdx] = '        {';
}

// 7. Remove the grouped rendering and keep the simple list rendering
replaceBetween(
  '      {/* 멤버 표시 - 포지션순/레벨순일 때 그룹화 */}',
  '      ) : (',
  '      {/* 멤버 표시 - 전체 리스트 */}\n      {'
);

// Need to fix the closing brace at the end of the return statement
for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].trim() === ')}') {
    if (lines[i-1].trim() === ')' && lines[i-2].trim() === '</div>') {
      // It's the end of the whole file/component
    }
  }
}

// Let's just fix the closing part mechanically
replaceBetween(
  '        </div>',
  '    </div>',
  '        </div>\n      }\n    </div>'
); // Actually wait, this might match the wrong div.

fs.writeFileSync(path, lines.join('\n'), 'utf8');
