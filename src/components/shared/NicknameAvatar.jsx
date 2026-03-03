import { nicknameToColor } from '../../utils/nicknameGenerator';

export default function NicknameAvatar({ nickname, size = 48 }) {
  const color = nicknameToColor(nickname || '');
  const initials = (nickname || '??').slice(0, 2).toUpperCase();

  return (
    <div
      className="nickname-avatar"
      style={{
        width: size, height: size, borderRadius: '50%',
        background: color, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: size * 0.35, fontWeight: 700,
      }}
    >
      {initials}
    </div>
  );
}
