const fs = require('fs');

const path = './app/components/team-management.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove states
content = content.replace(/  const \[levelFilter, setLevelFilter\] = useState\("all"\)\n/, '');
content = content.replace(/  const \[sortBy, setSortBy\] = useState<"name" | "position" | "level">\("name"\) \/\/ 기본: 가나다순\n/, '');

// 2. Fix getFilteredMembers
content = content.replace(/    \/\/ 레벨 필터 적용\n    if \(levelFilter !== "all"\) \{\n      filtered = filtered\.filter\(member => \{\n        const memberLevelCategory = getLevelCategory\(member\.level\)\n        return memberLevelCategory === levelFilter\n      \}\)\n    \}\n\n    \/\/ 이름 검색 필터 적용 \(가나다순일 때만\)\n    if \(sortBy === "name" && searchQuery\.trim\(\)\) \{/, '    // 이름 검색 필터 적용\n    if (searchQuery.trim()) {');

const sortRegex = /    \/\/ 정렬 적용\n    const sorted = \[\.\.\.filtered\]\.sort\(\(a, b\) => \{[\s\S]*?    \}\)/;
content = content.replace(sortRegex, `    // 정렬 적용 (가나다순)
    const sorted = [...filtered].sort((a, b) => {
      return a.name.localeCompare(b.name, 'ko')
    })`);

// 3. Remove getGroupedMembers
const getGroupedMembersRegex = /  \/\/ 포지션 대분류로 멤버 그룹화\n  const getGroupedMembers = \(\) => \{[\s\S]*?  \}\n\n/;
content = content.replace(getGroupedMembersRegex, '');

// 4. Header UI modifications
const sortBySelectRegex = /        \{\/\* 정렬 필터 - SELECT 형태 \(전체 너비\) \*\/\}\n[\s\S]*?        \}\}>\n[\s\S]*?        <\/Select>\n\n/;
content = content.replace(sortBySelectRegex, '');

const levelFilterSelectRegex = /        \{\/\* 레벨 필터 - 레벨순일 때만 표시 \*\/\}\n        \{sortBy === "level" && \([\s\S]*?        \)\}\n\n/;
content = content.replace(levelFilterSelectRegex, '');

content = content.replace(/        \{\/\* 이름 검색 필터 - 가나다순일 때만 표시 \*\/\}\n        \{sortBy === "name" && \(\n/, '        {/* 이름 검색 필터 */}\n        {\n');
content = content.replace(/        \{\/\* 포지션 필터 탭 - 포지션순일 때만 표시 \(전체 너비\) \*\/\}\n        \{sortBy === "position" && \(\n/, '        {/* 포지션 필터 탭 (전체 너비) */}\n        {\n');

// 5. Delete branch rendering for position/level
// It starts at: {/* 멤버 표시 - 포지션순/레벨순일 때 그룹화 */}
// and ends right before: // 가나다순일 때는 그룹화 없이 단순 리스트
const renderingRegex = /      \{\/\* 멤버 표시 - 포지션순\/레벨순일 때 그룹화 \*\/\}\n      \{sortBy === "position" \|\| sortBy === "level" \? \([\s\S]*?      \) : \(\n        \/\/ 가나다순일 때는 그룹화 없이 단순 리스트\n/;

content = content.replace(renderingRegex, '      {/* 멤버 표시 - 단순 리스트 */}\n      {\n        // 가나다순일 때는 그룹화 없이 단순 리스트\n');

// Also need to fix the closing brace for the ternary that we just removed.
// We changed `? (...) : (` into `{`
// At the end of the file, there should be `      )}` which we need to change to `      }`
const endRenderingRegex = /              \}\)\}\n            <\/div>\n          \)\}\n        <\/div>\n      \)\}\n    <\/div>\n  \)\n\}/;
content = content.replace(endRenderingRegex, '              })}\n            </div>\n          )}\n        </div>\n      }\n    </div>\n  )\n}');

fs.writeFileSync(path, content, 'utf8');
console.log('Refactoring complete.');
