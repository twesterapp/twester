import { useEffect, useRef, useState, SetStateAction, Dispatch } from 'react';

interface Lock {
    scrollLocked: boolean;
    setScrollLocked: Dispatch<SetStateAction<boolean>>;
}

// @see yoinked from https://github.com/mantinedev/mantine/blob/master/src/mantine-hooks/src/use-scroll-lock/use-scroll-lock.ts
export function useScrollLock(lock?: boolean): Lock {
    const [scrollLocked, setScrollLocked] = useState(lock || false);

    // value is stored to prevent body overflow styles override with initial useScrollLock(false)
    const locked = useRef(false);

    // after scroll is unlocked body overflow style returns to the previous known value
    const bodyOverflow = useRef<React.CSSProperties['overflow'] | null>(null);

    const unlockScroll = () => {
        if (locked.current) {
            locked.current = false;
            document.body.style.overflow = bodyOverflow.current || '';
        }
    };

    const lockScroll = () => {
        locked.current = true;
        bodyOverflow.current = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
    };

    useEffect(() => {
        if (scrollLocked) {
            lockScroll();
        } else {
            unlockScroll();
        }

        return unlockScroll;
    }, [scrollLocked]);

    useEffect(() => {
        if (lock !== undefined) {
            setScrollLocked(lock);
        }
    }, [lock]);

    useEffect(() => {
        if (lock === undefined && typeof window !== 'undefined') {
            if (window.document.body.style.overflow === 'hidden') {
                setScrollLocked(true);
            }
        }
    }, [lock, setScrollLocked]);

    return {
        scrollLocked,
        setScrollLocked,
    };
}
