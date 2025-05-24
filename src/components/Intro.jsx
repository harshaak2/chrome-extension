import { motion } from "framer-motion";

export default function Intro() {
    const container = (delay) => ({
        hidden: { x: -100, opacity: 0 },
        visible: {
            x: 0,
            opacity: 1,
            transition: { duration: 0.5, delay: delay },
        },
    });

    return (
        <div className="flex flex-col items-center justify-center h-full gap-2">
            <motion.h1
                initial="hidden"
                animate="visible"
                variants={container(0.1)}
                className="text-2xl font-bold text-center text-[#4123d8] !important font-mono"
                style={{ color: "#4123d8" }}
            >
                Quarterback
            </motion.h1>
            <motion.span
                initial="hidden"
                animate="visible"
                variants={container(0.2)}
                className="text-lg text-center font-mono"
            >
                Now at your Cursor
            </motion.span>
            {/* add login link if token not found */}
            {/* to be redirected to external cp auth link */}
            {/* cycp token to be stored in local storage */}
        </div>
    );
}
