import { SkillNode } from './skill-node';

const P = (x: number, y: number) => ({ position: 'absolute' as const, left: x, top: y });

/** The Vector `SkillNode.html` sample: one tile per state. */
export function SkillNodePreview() {
  return (
    <div style={{ position: 'relative', height: 118, minWidth: 820 }}>
      <SkillNode
        node={{ id: 'a', title: 'Retainer clients', icon: 'repeat', col: 0, row: 0 }}
        state="locked"
        style={P(0, 0)}
      />
      <SkillNode
        node={{
          id: 'b',
          title: 'Write a case study',
          icon: 'doc',
          col: 0,
          row: 0,
          steps: [
            { label: 'a', done: false },
            { label: 'b', done: false },
            { label: 'c', done: false },
          ],
        }}
        state="available"
        style={P(164, 0)}
      />
      <SkillNode
        node={{
          id: 'c',
          title: 'Discovery calls',
          icon: 'chat',
          col: 0,
          row: 0,
          maxLevel: 3,
          level: 1,
        }}
        state="active"
        style={P(328, 0)}
      />
      <SkillNode
        node={{
          id: 'd',
          title: 'Post every week',
          icon: 'video',
          col: 0,
          row: 0,
          maxLevel: 4,
          level: 3,
        }}
        state="active"
        style={P(492, 0)}
      />
      <SkillNode
        node={{ id: 'e', title: '$5K month', icon: 'money', col: 0, row: 0, progress: 1 }}
        state="mastered"
        style={P(656, 0)}
      />
      <SkillNode node={{ id: 'f', goal: true, col: 0, row: 0 }} state="goal" style={P(820, 0)} />
    </div>
  );
}
