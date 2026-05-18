type JumpTarget = 'blank' | 'self';

const setJumpTarget = (target: JumpTarget) => {
  window.localStorage.setItem('jumpTarget', target);
}

export const getJumpTarget = () => {
  return window.localStorage.getItem('jumpTarget') as JumpTarget;
}


export const initServerJumpTargetConfig = (setting: { jumpTargetBlank?: boolean }) => {
  if (!window.localStorage.getItem("initedServerJumpTarget")) {
    window.localStorage.setItem("initedServerJumpTarget", "true");
    if (setting.jumpTargetBlank === undefined || setting.jumpTargetBlank=== true) {
      setJumpTarget("blank")
    } else {
      setJumpTarget("self")
    }
  }
}