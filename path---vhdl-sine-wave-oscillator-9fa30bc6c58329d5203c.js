webpackJsonp([36940768073078],{469:function(e,a){e.exports={data:{markdownRemark:{html:'<p>In my last <a href="https://dwjbosman.github.io/vhdl-i-2-s-transmitter">article</a> a VHDL I2S transmitter was presented which allows one to playback arbitrary wave data. Eventually the goal is to develop an additive synthesis engine. In this article the goal is being able to generate a sine wave.</p>\n<p>As a starting point I use this <a href="https://github.com/jorisvr/vhdl_sincos_gen">VHDL sine generator</a> sub component. This generator is nicely parametrized. You can specify the number of bits in the output resolution as well as the phase input.</p>\n<p>The additive synthesis engine which is to be developed needs to be able to control the frequency of the oscillator. I am not sure yet on the required frequency resolution. I will pick a reasonable number and keep the formulas general so that the value can be easily changed later. The challenge in the development of this oscillator is to implement the following features:</p>\n<ul>\n<li>Configurable design parameter \'frequency resolution\' which allows specifying how precisely the frequency can be controlled.</li>\n<li>Real time configurable parameter \'frequency\', value between 1 Hz and half the sample rate. </li>\n<li>No floating point</li>\n<li>No general divisions</li>\n<li>Where possible use bit shifts to do multiplication / division.</li>\n</ul>\n<h1 id="phase-step"><a href="#phase-step" aria-hidden="true" class="anchor"><svg aria-hidden="true" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>Phase step</h1>\n<h2 id="theory"><a href="#theory" aria-hidden="true" class="anchor"><svg aria-hidden="true" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>Theory</h2>\n<p>The used sine wave generator sub component has two design parameters:</p>\n<ol>\n<li>Amplitude resolution: 24 bit</li>\n<li>Phase space size. This value has to be a power of two and determines the phase resolution as well as frequency resolution. Given a target frequency resolution the minimum required phase space bit width can be determined. </li>\n<li>Each sample a small step will be made to advance the phase of the sine. This phase step is a rational number and can be represented by a numerator and divisor. The algorithm will calculate the divisor and numerator.</li>\n</ol>\n<p>Step three has to be performed whenever the frequency is changed while the design is \'running\'. Step two can be performed design-time. The next steps calculate the static design-time parameters. In the formulas below I use \'->\' to show its value given a sample rate and target frequency resolution.</p>\n<h3 id="design-time-constants"><a href="#design-time-constants" aria-hidden="true" class="anchor"><svg aria-hidden="true" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>Design time constants</h3>\n<div class="gatsby-highlight">\n      <pre class="language-none"><code>Frequency resolution: \ntarget_frequency_resolution = 0.01 Hz\n\nSample Rate:          \nsample_rate       = 48000 Hz\nmax_frequency     = sample_rate / 2    \nnax_frequency    -> 24000 Hz\nPhase space size:\nphase_space_size  = sample_rate / target_frequency_resolution \nphase_space_size -> 4800000</code></pre>\n      </div>\n<p>The sine generator sub component requires the phase space to be a power of two. As phase_space_size is the minimum required phase space size it is required to round up to the nearest power of two.</p>\n<div class="gatsby-highlight">\n      <pre class="language-none"><code>Power of 2 phase space size: \npower2_phase_space_bits =  ceiling(log(phase_space_size) / log(2))      \npower2_phase_space_bits -> 23 bits\npower2_phase_space_size -> 2^23 -> 8388608</code></pre>\n      </div>\n<p>This results in a slightly better frequency resolution:</p>\n<div class="gatsby-highlight">\n      <pre class="language-none"><code>Desired frequency resolution:\ntarget_frequency_resolution = 0.01 Hz\n\nQuantized frequency resolution:\nquantized_frequency_resolution =  sample_rate / power2_phase_space_size\nquantized_frequency_resolution -> 0.0057220459</code></pre>\n      </div>\n<p>The reciprocal of the frequency resolution is the phase step. At each played back sample at 48 kHz sample rate the phase is increased by the phase step.</p>\n<div class="gatsby-highlight">\n      <pre class="language-none"><code>Phase step:\nphase_step  = 1 / quantized_frequency_resolution\nphase_step -> 174.7626666667\nphase_step_bits = log2(phase_step)\nphase_step_bits = 7.449 bits\nassert: sample_rate * phase_step == power2_phase_space_size</code></pre>\n      </div>\n<p>The phase step needs to be rounded to a power of two so that it can be easily used in integer division and multiplication. It is possible to round down if the resulting frequency resolution is still above the target. If not round up:</p>\n<div class="gatsby-highlight">\n      <pre class="language-none"><code>power2_phase_step_bits =  floor(log(phase_step)/log(2))      \npower2_phase_step_bits -> 7 bits\npower2_phase_step      -> 128\nfrequency resolution would be: 1/128 -> 0.0078125\n\npower2_phase_step_bits =  ceil(log(phase_step)/log(2))      \npower2_phase_step_bits -> 8 bits\npower2_phase_step      -> 256\nfrequency resolution would be: 1/256 -> 0.00390625</code></pre>\n      </div>\n<p>With 7 bits the frequency resolution is still above the target. At run-time the frequency of the oscillator can be set as an integer value by multiplying the target frequency with the scaling factor. For example to get 440 Hz, the frequency parameter of the oscillator will be set to 440 * 128 = 56320.</p>\n<p>The combinations of the sample_rate and power2_phase_space_size vales imply a non-integer phase_step value (174.76...). The phase_step value needs to be scaled up to keep accuracy when using it in division. To determine the number of bits in the scaling factor first the determine the maximum error introduced by quantisation. </p>\n<div class="gatsby-highlight">\n      <pre class="language-none"><code>scaled_phase_step          = trunc(phase_step * phase_step_scaling_factor)\nquantised_phase_step_error = phase_step - scaled_phase_step / phase_step_scaling_factor \nmaximum_phase_error        = maximum_frequency * quantised_phase_step_error</code></pre>\n      </div>\n<p>This maximum_error must be below 1. So the quantised_phase_step_error must be lower then:</p>\n<div class="gatsby-highlight">\n      <pre class="language-none"><code>max_quantised_phase_step_error       = 1 / maximum_frequency\nmax_quantised_phase_step_error      -> 0.00004166...\nmax_quantised_phase_step_error_bits -> 14.5507... bits</code></pre>\n      </div>\n<p>This implies the required number of bits in the scaled phase step:</p>\n<div class="gatsby-highlight">\n      <pre class="language-none"><code>scaled_phase_step_bits          = ceiling( phase_step_bits + max_quantised_phase_step_error_bits)\nscaled_phase_step_bits         -> 22</code></pre>\n      </div>\n<p>For the phase step scaling factor there are two options. Choose the lowest number of bits that still results in an error lower than one.</p>\n<div class="gatsby-highlight">\n      <pre class="language-none"><code>phase_step_scaling_factor_bits  = ceiling ( max_quantised_phase_step_error_bits ) \nphase_step_scaling_factor_bits -> 15\nphase_step_scaling_factor      -> 2^15 -> 32768\nscaled_phase_step               = trunc(phase_step * phase_step_scaling_factor)\nscaled_phase_step              -> 5726623\n\nphase_step_error  = phase_step - scaled_phase_step / phase_step_scaling_factor \nphase_step_error -> 0.000001871744786\n\nmax_error         = maximum_frequency * phase_step_error \nmax_error        -> 0.04492187486 must be <1</code></pre>\n      </div>\n<p>Or</p>\n<div class="gatsby-highlight">\n      <pre class="language-none"><code>phase_step_scaling_factor_bits  = floor ( max_quantised_phase_step_error_bits ) \nphase_step_scaling_factor_bits -> 14\nphase_step_scaling_factor      -> 2^14 -> 16384\nscaled_phase_step               = trunc(phase_step * phase_step_scaling_factor)\nscaled_phase_step              -> 2863311\n\nphase_step_error  = phase_step - scaled_phase_step / phase_step_scaling_factor \nphase_step_error -> 0.00003238932291\n\nmax_error         = maximum_frequency * phase_step_error \nmax_error        -> 0.7773437499 must be <1</code></pre>\n      </div>\n<p>So 14 bits can be used for the phase step scaling factor.</p>\n<h3 id="run-time-parameters"><a href="#run-time-parameters" aria-hidden="true" class="anchor"><svg aria-hidden="true" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>Run time parameters</h3>\n<p>Let\'s say the frequency to generate is 440.0078125 Hz. Then the input scaled frequency would be:</p>\n<div class="gatsby-highlight">\n      <pre class="language-none"><code>frequency_scaled = frequency * power2_phase_step\nfrequency_scaled -> 56321</code></pre>\n      </div>\n<p>If it would be possible to use floating point arithmetic the phase step would be:</p>\n<div class="gatsby-highlight">\n      <pre class="language-none"><code>phase_step_fp  = ( power2_phase_space_size / sample_rate ) * frequency</code></pre>\n      </div>\n<p>or rewritten:</p>\n<div class="gatsby-highlight">\n      <pre class="language-none"><code>phase_step_fp -> ( power2_phase_space_size * frequency ) / sample_rate\nphase_step_fp -> 76896.93867</code></pre>\n      </div>\n<p>The integer version of phase_step_fp consists of phase_step_decimal and phase_step_numerator. Phase_step_decimal will give the decimal part (in the example 76895) while the fraction (0.57333...) will be specified as a numerator, divisor pair (a rational number). The decimal part is calculated as follows:</p>\n<div class="gatsby-highlight">\n      <pre class="language-none"><code>scaled_phase  = frequency_scaled * scaled_phase_step\nscaled_phase -> 161264538831\n\ndecimal_divider_bits  = power2_phase_step_bits + phase_step_scaling_bits\ndecimal_divider_bits -> 21\nphase_step_decimal    = shift_right ( scaled_phase, decimal_deivider_bits)\nphase_step_decimal   -> 76896</code></pre>\n      </div>\n<p>Generally the phase_step_decimal will equal the decimal part of the phase_step_fp. In corner cases when the fractional part of phase_step_fp is near zero the decimal part will be off by one. For example with a scaled frequency of 440573 (3441.97 Hz) the actual phase step will be 601529.0027. However the quantised phase step will be floor(601528.8912) = 601528 which is off by one. </p>\n<p>Now the fractional part is calculated as a rational value. The value consists of a numerator and divisor.  Recall the calculation of phase_step_fp:</p>\n<div class="gatsby-highlight">\n      <pre class="language-none"><code>phase_step_fp -> ( power2_phase_space_size * frequency ) / sample_rate</code></pre>\n      </div>\n<p>This value can be converted to a rational number:</p>\n<div class="gatsby-highlight">\n      <pre class="language-none"><code>phase_step_divisor  = sample_rate\nphase_step_divisor -> 48000\n\nusing frequency_scaled (an integer value) instead of the floating point frequency:\n\nphase_step_numerator_incl_decimal  = ( power2_phase_space_size * frequency_scaled ) / power2_phase_step\nphase_step_numerator_incl_decimal  = shift_right ( power2_phase_space_size * frequency_scaled, power2_phase_step_bits)\nphase_step_numerator_incl_decimal -> 3691053056</code></pre>\n      </div>\n<p>The fact that phase_step_fp is larger than one implies that the numerator is larger than the divisor. To get the fractional part without the decimal part the decimal value is subtracted:\n<br>\nphase<em>step</em>numerator  = phase<em>step</em>numerator<em>incl</em>decimal - phase<em>step</em>decimal * sample<em>rate\nphase</em>step_numerator -> 45056</p>\n<p>Assert that the rational number is indeed the fractional part of phase_step_fp:</p>\n<div class="gatsby-highlight">\n      <pre class="language-none"><code>phase_step_fp -> 76896.93867\nphase_step_numerator / phase_step_divisor -> 0.93867</code></pre>\n      </div>\n<p>In the earlier described corner cases it could be that the numerator is still larger than the divider after subtraction of the decimal part. It will however always be smaller than 2 * divider. So when the numerator is larger than the divider it is possible to simply subtract the divider once to get the numerator corresponding to the fractional part. In that case the phase_step_decimal value is increased by one.</p>\n<p>The sine <a href="https://docs.google.com/spreadsheets/d/1zl4uNqo22D30khxiX1On5RydeTHjTQGgfvHI6CXL8H8/edit?usp=sharing">phase step</a>  calculations in this section can also be found on Google sheets.</p>\n<h1 id="vhdl-design"><a href="#vhdl-design" aria-hidden="true" class="anchor"><svg aria-hidden="true" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>VHDL Design</h1>\n<p>In this article I focus on generating a single sine wave. The following will be tested:</p>\n<ul>\n<li>Setting the sine generator to a certain frequency.</li>\n<li>Updating the frequency : This should not introduce noticeable audio \'glitches\'.</li>\n</ul>\n<p>The top level design simply connects an oscillator (the sine_wave component) to the I2S_sender. Two buttons enable toggling sine wave frequency. The sine_wave component takes a frequency as its input and presents the sine wave samples at its output.</p>\n<h2 id="interface"><a href="#interface" aria-hidden="true" class="anchor"><svg aria-hidden="true" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>Interface</h2>\n<p>The sine wave generator has the following interface:</p>\n<div class="gatsby-highlight">\n      <pre class="language-none"><code>entity sine_wave is\n    Port ( resetn : std_logic;\n           MCLK_in : in std_logic; -- Master clock of the I2S Sender\n           \n           freq_in_ce: in std_logic; -- if \'1\' freq_in will be sampled on rising edge\n           freq_in: in frequency_t; -- the scaled frequency of the sine\n\n           wave_out : out sample_t -- the generated output samples\n           );\nend sine_wave;</code></pre>\n      </div>\n<h2 id="architecture"><a href="#architecture" aria-hidden="true" class="anchor"><svg aria-hidden="true" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>Architecture</h2>\n<p>The architecture consists of the sincos generator sub component and three processes:</p>\n<ul>\n<li>\n<p>Calculating the sample clock. Each tick the sine phase will need to be updated.</p>\n</li>\n<li>\n<p>Accepting new frequency updates and update the phase step value. Calculating the phase step value is accomplished through a procedure</p>\n<div class="gatsby-highlight">\n      <pre class="language-none"><code>procedure Calculate_Phase_Step(\n    constant frequency_scaled: in frequency_t;\n    variable phase_step: out phase_step_t) </code></pre>\n      </div>\n</li>\n<li>\n<p>Generate sine samples by advancing the phase with the phase step. The phase value is presented to the sincos generator sub component. Updating the phase is again accomplished with a procedure. The implementation will use the decimal phase step and fractional phase step values. Each sample the phase will be increased with the decimal part: phase<em>step</em>decimal. Each sample the phase<em>step</em>numerator will be added to a counter. When the counter value is above the phase<em>step</em>divisor (the sample rate) value the phase will be advanced by one and the counter is decreased by the divisor.</p>\n<div class="gatsby-highlight">\n      <pre class="language-none"><code>type phase_step_t is record \n    decimal : phase_step_decimal_t;\n    fraction : phase_step_fraction_t; -- fractional / sample_rate\nend record;\n\ntype phase_state_t is record\n    step : phase_step_t;\n    -- the decimal part, added each step\n    current: phase_t; \n    -- the fractional part, if it overflows (above sample_rate)\n    -- then the it is reset and current is increased by one\n    current_fraction: phase_fraction_t; \nend record;\n        \nprocedure Advance_Phase(\n    variable phase: inout phase_state_t)</code></pre>\n      </div>\n</li>\n</ul>\n<h2 id="testing"><a href="#testing" aria-hidden="true" class="anchor"><svg aria-hidden="true" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>Testing</h2>\n<p>Two testbenches have been setup.</p>\n<h3 id="testing-phase-step-calculation"><a href="#testing-phase-step-calculation" aria-hidden="true" class="anchor"><svg aria-hidden="true" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>Testing phase step calculation.</h3>\n<p>The \'sine_sim\' tests the calculation of the design time constants and calculating the phase step decimal and fractional values. This is fairly simple: </p>\n<ol>\n<li>calculate the real phase step using standard floating point arithmetic.</li>\n<li>calculate the same value using the phase step calculation algorithm.</li>\n<li>compare the values: if the difference is too large report an error.</li>\n</ol>\n<p>The phase step will be added to the phase each time a sample is generated. A test is performed to check that the phase is updated correctly:</p>\n<ol>\n<li>Advance the phase a number of times.</li>\n<li>Update a version of the phase given the phase step as a floating point value.</li>\n<li>Update a version of the phase given the phase step as a decimal and fractional part.</li>\n<li>Each iteration compare if the difference between both both version of the phase is small.</li>\n</ol>\n<h3 id="testing-the-sine-wave-generator"><a href="#testing-the-sine-wave-generator" aria-hidden="true" class="anchor"><svg aria-hidden="true" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>Testing the sine wave generator</h3>\n<p>The simulation sets up a sine wave generator and configures its frequency to 440 Hz. The output samples are shown in Vivado\'s wave view. You can configure the way a signal is presented in the wave view. By showing the wave output as an analog signal with radix \'signed decimal\' a nice sine wave is readily visible. Two markers were added to check the frequency of the sine wave. The check indeed shows that the sine wave has a frequency of 440 Hz.</p>\n<p>\n  <a\n    class="gatsby-resp-image-link"\n    href="/static/sine_440-273ac55780a91441eb21b34e03f5cd5d-31b0a.png"\n    style="display: block"\n    target="_blank"\n    rel="noopener"\n  >\n  \n  <span\n    class="gatsby-resp-image-wrapper"\n    style="position: relative; display: block; ; max-width: 1079px; margin-left: auto; margin-right: auto;"\n  >\n    <span\n      class="gatsby-resp-image-background-image"\n      style="padding-bottom: 31.60333642261353%; position: relative; bottom: 0; left: 0; background-image: url(\'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAGCAIAAABM9SnKAAAACXBIWXMAAAsSAAALEgHS3X78AAABEUlEQVQY01WLy06DUBCGh5yDwOHSoEDrxrIxfRyNFomlXiK1VNNGEpO6QNs3NQYFCgW0MXEthzaNTiZf/vlmBl7DNIyyMFpGi/ztI4vT8j3Jq5wsv5K0jBdFnBRJ9lmufuK0qLZZvsrL73XDg/84nT4Fzy+2bR8dn1iWddrtBoEzm194Xu/sf9nnPWcy709m6xGcy+vqvX/lqkOVd/nGfUMYCPs+ZZXFoajcKfJIljyJjp6m+3pl1DE9hoO22TnsmG2THbCMy8ANVCQj2Oa/FMZ76BZtDbDsjmEYmqbxKo9kBDIgFZEmJUhADakp1maXUCobDxzHtZotQzdkmccCBgYwxoRQAgJq2Jq4NiyhhI3/BUcRZQVHd0cfAAAAAElFTkSuQmCC\'); background-size: cover; display: block;"\n    >\n      <img\n        class="gatsby-resp-image-image"\n        style="width: 100%; height: 100%; margin: 0; vertical-align: middle; position: absolute; top: 0; left: 0; box-shadow: inset 0px 0px 0px 400px white;"\n        alt="440 Hz sine wave"\n        title="440 Hz sine wave"\n        src="/static/sine_440-273ac55780a91441eb21b34e03f5cd5d-31b0a.png"\n        srcset="/static/sine_440-273ac55780a91441eb21b34e03f5cd5d-f77c2.png 300w,\n/static/sine_440-273ac55780a91441eb21b34e03f5cd5d-c0f67.png 600w,\n/static/sine_440-273ac55780a91441eb21b34e03f5cd5d-31b0a.png 1079w"\n        sizes="(max-width: 1079px) 100vw, 1079px"\n      />\n    </span>\n  </span>\n  \n  </a>\n    </p>\n<h1 id="final-thoughts"><a href="#final-thoughts" aria-hidden="true" class="anchor"><svg aria-hidden="true" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>Final thoughts</h1>\n<ul>\n<li>\n<p>It would be interesting to check if the fixed point value types in VHDL 2008 could simplify things. Getting the fixed point package working in Vivado seemed a hassle.</p>\n</li>\n<li>\n<p>Using an embedded bit scope (Xilinx ila) helped in finding a bug in the i2s_sender. It was simulating correctly, but synthesized with an bug. One of the steps setting up an ila is marking signals to be debugged with an attribute \'mark_debug\'. I was able to enable and disable debugging using a generic variable:</p>\n<div class="gatsby-highlight">\n      <pre class="language-none"><code>attribute mark_debug of signal_name : signal is boolean\'image(debug_generic_var)</code></pre>\n      </div>\n</li>\n<li>\n<p>In VHDL setting a constant to a value given a condition is not straight forward. You can use a function to return a value based on a condition and use that function to set the constant:</p>\n<div class="gatsby-highlight">\n      <pre class="language-none"><code>function sel(Cond: BOOLEAN; If_True, If_False: real) return real is\nbegin\n   if (Cond = TRUE) then\n       return(If_True);\n   else\n       return(If_False);\n   end if;\nend function sel; \n\nconstant X : real := sel( TRUE, 1.0, 2.0); -- will set X to 1.0 </code></pre>\n      </div>\n</li>\n</ul>\n<p>The VHDL code can be found in the <a href="https://github.com/dwjbosman/I2S_sender">i2s_sender</a> repository.</p>',timeToRead:11,excerpt:"In my last  article  a VHDL I2S transmitter was presented which allows one to playback arbitrary wave data. Eventually the goal is to…",frontmatter:{title:"VHDL sine wave oscillator",cover:"/logos/sine-article.jpg",date:"2018-09-22 22:00",category:"FPGA",tags:["VHDL FPGA DSP"]},fields:{nextTitle:"VHDL sine wave oscillator",nextSlug:"/vhdl-sine-wave-oscillator",prevTitle:"VHDL sine wave oscillator",prevSlug:"/vhdl-sine-wave-oscillator",slug:"/vhdl-sine-wave-oscillator"}}},pathContext:{slug:"/vhdl-sine-wave-oscillator"}}}});
//# sourceMappingURL=path---vhdl-sine-wave-oscillator-9fa30bc6c58329d5203c.js.map