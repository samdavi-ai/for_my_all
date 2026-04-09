// Application-wide Constants

export const SUBJECT_COLORS = {
  'Mathematics': '#3B82F6', // blue
  'Physics': '#8B5CF6',     // purple
  'Chemistry': '#EC4899',   // pink
  'Computer Science': '#10B981', // green
  'English': '#F59E0B',     // amber
  'History': '#EF4444',     // red
  'Biology': '#14B8A6',     // teal
  'Economics': '#06B6D4',   // cyan
  'Others': '#64748B'       // slate
};

export const getColorForSubject = (subject) => {
  if (SUBJECT_COLORS[subject]) return SUBJECT_COLORS[subject];
  
  // Consistent color resolution for custom subjects via simple hash
  const colors = Object.values(SUBJECT_COLORS).filter(c => c !== '#64748B');
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const MOOD_EMOJIS = [
  '😞', '😟', '😕', '😐', '🙂', 
  '😊', '😃', '😄', '😁', '🤩'
];

export const LEARNING_STYLES = ['Visual', 'Auditory', 'Reading', 'Kinesthetic'];
