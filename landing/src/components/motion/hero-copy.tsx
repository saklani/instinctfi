import { motion, useReducedMotion, type Variants } from "motion/react"

const container: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
}

const item: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
}

export default function HeroCopy() {
  const reduce = useReducedMotion()

  if (reduce) {
    return (
      <>
        <h1 className="responsive">
          Your cheatcode to
          <br />
          Internet Capital Markets
        </h1>
        <p className="mb-6 responsive text-base lg:text-xl">
          One click exposure to tokenized assets
          <br />
          curated from the hottest trends of the internet
        </p>
      </>
    )
  }

  return (
    <motion.div
      className="contents"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      <motion.h1 className="responsive" variants={item}>
        Your cheatcode to
        <br />
        Internet Capital Markets
      </motion.h1>
      <motion.p
        className="mb-6 responsive text-base lg:text-xl"
        variants={item}
      >
        One click exposure to tokenized assets
        <br />
        curated from the hottest trends of the internet
      </motion.p>
    </motion.div>
  )
}
