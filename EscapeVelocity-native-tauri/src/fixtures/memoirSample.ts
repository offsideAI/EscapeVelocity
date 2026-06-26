/** M1 hardcoded fixture: a small, self-contained `memoir` book at 6×9 trim.
 *  Editable in the LaTeX view to prove the compile→preview loop. Deliberately
 *  uses only the `memoir` class + default fonts so it compiles anywhere without
 *  needing a specific OTF font (fontspec/system fonts arrive with M2/M5). */
export const MEMOIR_SAMPLE = String.raw`% EscapeVelocity — sample document (M1 fixture)
\documentclass[11pt,oneside]{memoir}

% --- Trim & stock: 6 x 9 in (KDP Paperback) ---
\setstocksize{9in}{6in}
\settrimmedsize{9in}{6in}{*}
\setlrmarginsandblock{0.875in}{0.625in}{*}
\setulmarginsandblock{0.9in}{0.9in}{*}
\checkandfixthelayout

% --- Body & paragraphs ---
\setlength{\parindent}{1.5em}
\chapterstyle{default}
\pagestyle{plain}

\begin{document}

\chapter{The Fog Lifts at Last}

It was the kind of morning that arrives only at the edge of the world, when the
fog has not yet decided whether to lift or to stay, and the sea lies flat and
grey as hammered pewter. Mara climbed the one hundred and ninety-two steps to the
lantern room as she had every dawn for eleven years, counting them not because
she might forget their number but because the counting steadied her hands.

At the top she set down her lamp and looked out at nothing in particular: the
same horizon, the same indifferent water, the same gulls wheeling on currents she
could not see. The lighthouse had been her father's, and his father's, and now it
was hers alone, which is to say it belonged to no one and she merely tended it.

\section{A Letter Arrives}

The boat came on Thursdays when it came at all. That week it brought flour, a
coil of new rope, and a single envelope the colour of weak tea, addressed in a
hand she did not recognise. She turned it over twice before opening it, as though
the back might explain the front.

Inside was a single sheet, and on the sheet a single sentence, and that sentence
undid eleven years of careful counting in the time it took to read it. She folded
the letter along its original creases, slid it into her coat, and climbed the
stairs again — not to tend the light, this time, but simply to stand where she
could see the whole grey reach of the sea and decide what a person was supposed to
do with news that arrived too late to be of any use and too early to be ignored.

Outside, the fog made up its mind at last and began, very slowly, to lift.

\end{document}
`;
