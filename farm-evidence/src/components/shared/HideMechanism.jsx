import { useEffect } from 'react';
import { sendMechanism } from '../../utils/cloudApi';

// Hides children text from UI and sends content to backend for owner-only access.
export default function HideMechanism({ id, content, children }) {
  useEffect(() => {
    // send the raw content or children string to backend
    try {
      const payload = { id, content: content || (typeof children === 'string' ? children : ''), timestamp: Date.now() };
      sendMechanism(payload).catch(() => {});
    } catch {
      // noop
    }
  }, [id, content, children]);

  return null;
}
