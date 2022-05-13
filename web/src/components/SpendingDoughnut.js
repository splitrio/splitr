import { Chart, DoughnutController, ArcElement, Tooltip } from 'chart.js';
import { useEffect, useRef } from 'react';
import useTheme from '../hooks/useTheme';
import { formatCurrency } from '../util/util';

import './SpendingDoughnut.scss';

class SpendingDoughnutController extends DoughnutController {
    draw() {
        super.draw();

        // Copied from:
        // https://stackoverflow.com/a/43026361
        // (Thank god)
        if (this.chart.config.options.elements.center) {
            // Get ctx from string
            var ctx = this.chart.ctx;

            // Get options from the center object in options
            var centerConfig = this.chart.config.options.elements.center;
            var fontStyle = centerConfig.fontStyle || 'Arial';
            var txt = centerConfig.text;
            var color = centerConfig.color || '#000';
            var maxFontSize = centerConfig.maxFontSize || 75;
            var sidePadding = centerConfig.sidePadding || 20;
            var sidePaddingCalculated =
                (sidePadding / 100) * (this.chart._metasets[this.chart._metasets.length - 1].data[0].innerRadius * 2);
            // Start with a base font of 30px
            ctx.font = '30px ' + fontStyle;

            // Get the width of the string and also the width of the element minus 10 to give it 5px side padding
            var stringWidth = ctx.measureText(txt).width;
            var elementWidth =
                this.chart._metasets[this.chart._metasets.length - 1].data[0].innerRadius * 2 - sidePaddingCalculated;

            // Find out how much the font can grow in width.
            var widthRatio = elementWidth / stringWidth;
            var newFontSize = Math.floor(30 * widthRatio);
            var elementHeight = this.chart._metasets[this.chart._metasets.length - 1].data[0].innerRadius * 2;

            // Pick a new font size so it will not be larger than the height of label.
            var fontSizeToUse = Math.min(newFontSize, elementHeight, maxFontSize);
            var minFontSize = centerConfig.minFontSize;
            var lineHeight = centerConfig.lineHeight || 25;
            var wrapText = false;

            if (minFontSize === undefined) {
                minFontSize = 20;
            }

            if (minFontSize && fontSizeToUse < minFontSize) {
                fontSizeToUse = minFontSize;
                wrapText = true;
            }

            // Set font settings to draw it correctly.
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            var centerX = (this.chart.chartArea.left + this.chart.chartArea.right) / 2;
            var centerY = (this.chart.chartArea.top + this.chart.chartArea.bottom) / 2;
            ctx.font = fontSizeToUse + 'px ' + fontStyle;
            ctx.fillStyle = color;

            if (!wrapText) {
                ctx.fillText(txt, centerX, centerY);
                return;
            }

            var words = txt.split(' ');
            var line = '';
            var lines = [];

            // Break words up into multiple lines if necessary
            for (let n = 0; n < words.length; n++) {
                var testLine = line + words[n] + ' ';
                var metrics = ctx.measureText(testLine);
                var testWidth = metrics.width;
                if (testWidth > elementWidth && n > 0) {
                    lines.push(line);
                    line = words[n] + ' ';
                } else {
                    line = testLine;
                }
            }

            // Move the center up depending on line height and number of lines
            centerY -= (lines.length / 2) * lineHeight;

            for (let n = 0; n < lines.length; n++) {
                ctx.fillText(lines[n], centerX, centerY);
                centerY += lineHeight;
            }
            //Draw text in center
            ctx.fillText(line, centerX, centerY);
        }
    }
}

SpendingDoughnutController.id = 'spacedDoughnut';
SpendingDoughnutController.defaults = {
    ...DoughnutController.defaults,
};
Chart.register([ArcElement, Tooltip, SpendingDoughnutController]);

function SpendingDoughnutChart({ data, options = {} }) {
    const chartElementRef = useRef();
    const chartRef = useRef(null);

    // Create the chart when component mounts
    useEffect(() => {
        const context = chartElementRef.current.getContext('2d');
        chartRef.current = new Chart(context, {
            type: 'spacedDoughnut',
            data: data,
            options: options,
        });
        return () => chartRef.current?.destroy();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update the chart any time its data or options changes
    useEffect(() => {
        if (!chartRef.current) return;
        chartRef.current.options = options;
        chartRef.current.data = data;
        chartRef.current.update();
    }, [data, options]);

    return (
        <div className='chart-container'>
            <canvas ref={chartElementRef} />
        </div>
    );
}

export default function SpendingDoughnut({ expense }) {
    const contrast = useTheme('h1-color');
    const fontFamily = useTheme('font-family');

    const data = {
        labels: ['Red', 'Blue', 'Yellow'],
        datasets: [
            {
                data: expense.users.map(user => user.contribution),
                backgroundColor: expense.users.map(user => (user.paid ? contrast : 'transparent')),
                borderWidth: 1,
                hoverOffset: 10,
                borderColor: contrast,
            },
        ],
    };

    return (
        <SpendingDoughnutChart
            data={data}
            options={{
                layout: {
                    padding: 10,
                },
                maintainAspectRatio: false,
                elements: {
                    center: {
                        text: formatCurrency(expense.total),
                        color: contrast,
                        fontStyle: fontFamily,
                        sidePadding: 30,
                        minFontSize: false, // Default is 20 (in px), set to false and text will not wrap.
                    },
                },
                plugins: {
                    tooltip: {
                        displayColors: false,
                        callbacks: {
                            title: model => {
                                const idx = model[0].dataIndex;
                                const user = expense.users[idx];
                                return `${user.firstName} ${user.lastName}`;
                            },
                            label: model => {
                                const idx = model.dataIndex;
                                const user = expense.users[idx];
                                return `${formatCurrency(user.contribution)} (${(100 * user.proportion).toFixed(1)}%)`;
                            },
                            footer: model => {
                                const idx = model[0].dataIndex;
                                const user = expense.users[idx];
                                return user.paid ? 'Paid' : '';
                            },
                        },
                    },
                },
                animation: {
                    duration: 2000,
                },
            }}
        />
    );
}
