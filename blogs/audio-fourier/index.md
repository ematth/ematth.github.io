---
title: Fourier Transform
date: 2023-07-04
---

The **Fourier Transform** is a transformation of a time-series function which returns a respective frequency-series function, or an equivalent function who takes a frequency $f$ as an input rather than a time $t$

$$\hat{f}(\xi) = \int_{-\infty}^{\infty} f(t) e^{-i2\pi\xi t} dt$$

where $f(t)$ is the original function for our sound in terms of time $t$, and $\hat{f}(\xi)$ is an equivalent function in terms of frequency $\xi$. In essence, this function takes in a frequency and determines that frequency's *intensity* or usage in a sound across all time values $t$ in $f(t)$- hence why we're integrating with respect to time. For example, if we have a sound and want to know if the frequency A4 = 440 Hz was used, we can compute $\hat{f}(440)$ to figure out whether or not there's a "peak" for this frequency, (indicating that it is exists in our sound.) 

However, this formula is much more complicated than a summation over time series, and we'll need to understand how $e^{-i2\pi\xi t}$ and the complex plane plays into the Fourier Transform.

Looking at only the imaginary term of $e^{-i2\pi\xi t}$, we can break it up into several components: $e^{it}$ is derived from [Euler's Formula](https://en.wikipedia.org/wiki/Euler%27s_formula), where $t$ represents an angle on a unit circle. Using $e^{-it}$ flips the direction in which we traverse the circle as $t$ approaches a large positive value. $2\pi$ is a constraint for graphing all values of $t$ onto *complete rotations* of the unit circle. It's best to think of this portion as a way of mapping any function $f(t)$ onto the unit circle. Finally, by integrating $f(t) e^{-i2\pi\xi t}$ for all values of $t$, we get a function defining the intensity of a certain frequency $\xi$ in the complex plane over time. This combination of steps allows us to compute a function for any frequency $\xi$ to determine if a certain frequency is present in a sound.

<hr>

# Discrete Fourier Transform (DFT)

With the basics of the Fourier Transform understood, we can jump into a more practical uses of the fourier transform for audio processing. The above formula works on infinite, continuous time signals, but in a more applicable sense, we'd like to use this formula on finite, *discrete* time signals, (i.e. a set number of samples, with no information in between samples.) For that, we have the **Discrete Fourier Transform**, or **DFT**:

$$X_k = \sum_{n=1}^{N}x_n e^{-i\frac{2\pi kn}{N}}$$

The equation can be described like this: given a frequency $k$, $X_k$ returns the intensity of that frequency across all samples $n\in N$. The logic behind this equation is similar to the continuous Fourier transform, although this transformation will return an estimate for the frequency in the $N$ samples provided.

<hr>


# References

- 3Blue1Brown: "But what is the Fourier Transform? A visual introduction."
    https://www.youtube.com/watch?v=spUNpyF58BY&ab_channel=3Blue1Brown

- Julius O. Smith: "FOURIER TRANSFORMS FOR CONTINUOUS/DISCRETE TIME/FREQUENCY"
    https://www.dsprelated.com/freebooks/sasp/Fourier_Transforms_Continuous_Discrete_Time_Frequency.html#chap:fourcases

- Wikipedia: "Fourier Transform"
    https://en.wikipedia.org/wiki/Fourier_transform 