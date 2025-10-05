export const sm2 = (quality: number, repetitions: number, previousInterval: number, previousEaseFactor: number) => {
    let interval: number;
    let easeFactor: number;

    if (quality >= 3) {
        switch (repetitions) {
            case 0:
                interval = 1
                break
            case 1:
                interval = 6
                break
            default:
                interval = Number((previousInterval * previousEaseFactor).toFixed(2))
                break
        }

        repetitions++
        easeFactor = previousEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    } else {
        interval = 1
        repetitions = 0
        easeFactor = previousEaseFactor
    }

    if (easeFactor < 1.3) {
        easeFactor = 1.3
    }

    return {
        quality,
        interval,
        repetitions,
        easeFactor,
    }
}