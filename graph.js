// Configuration
const config = {
    zoom: {
        min: 0.1,
        max: 4,
    },
    nodes: {
        project: {
            radius: 12,
            color: "#4a9eff",
            label: {
                fontSize: "30px",
                fontWeight: "bold",
                color: "#ffffff",
                fontFamily: "Arial",
            },
        },
        tag: {
            radius: 10,
            color: "#666666",
            label: {
                fontSize: "16px",
                fontWeight: "normal",
                color: "#ffffff",
                fontFamily: "Arial",
            },
        },
    },
    links: {
        color: "#666666",
        hoverColor: "#ffffff",
        opacity: 0.4,
        width: 2,
    },
    forces: {
        link: {
            distance: 30,
            strength: 0.4,
            iterations: 3,
        },
        charge: {
            strength: -20,
        },
        center: {
            strength: 0.0,
        },
        collision: {
            radius: 100,
            strength: 0.50,
        },
        x: {
            strength: 0.1,
        },
        y: {
            strength: 0.1,
        },
    },
    layout: {
        padding: 50,
    },
};

// Graph initialization
const container = document.getElementById("graph-container");
const tooltip = document.getElementById("tooltip");

const MIN_WIDTH = 600;
const MIN_HEIGHT = 300;

let simulation;
let nodes = [];
let links = [];

// Initialize the graph
function initializeGraph() {
    const width = Math.max(container.clientWidth, MIN_WIDTH);
    const height = Math.max(container.clientHeight, MIN_HEIGHT);

    // Create SVG
    const svg = d3.select("#graph-container")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    // Add background
    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "#1a1a1a");

    // Create main group
    const g = svg.append("g");

    // Add arrow marker definition
    svg.append("defs").append("marker")
        .attr("id", "arrowhead")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 45)
        .attr("refY", 0)
        .attr("orient", "auto")
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("xoverflow", "visible")
        .append("svg:path")
        .attr("d", "M 0,-5 L 10 ,0 L 0,5")
        .attr("fill", config.links.color)
        .style("stroke", "none");

    // Setup zoom
    const zoom = d3.zoom()
        .scaleExtent([config.zoom.min, config.zoom.max])
        .extent([[0, 0], [width, height]])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
        });

    svg.call(zoom);

    // Create links
    const linkElements = g.append("g")
        .selectAll("line")
        .data(links)
        .enter()
        .append("line")
        .attr("class", "link")
        .attr("stroke", config.links.color)
        .attr("stroke-opacity", config.links.opacity)
        .attr("stroke-width", config.links.width);

    // Create nodes
    const nodeElements = g.append("g")
        .selectAll("g")
        .data(nodes)
        .enter()
        .append("g")
        .attr("class", "node")
        .style("cursor", "pointer")
        .call(
            d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended),
        );

    // Add background rectangles for all nodes
    nodeElements.append("rect")
        .attr("x", d => d.type === "project" ? -d.name.length * 4 - 15 : -d.name.length * 8 - 15)
        .attr("y", -25)
        .attr("width", d => d.type === "project" ? d.name.length * 8 + 30 : d.name.length * 16 + 30)
        .attr("height", 50)
        .attr("fill", "#1a1a1a")
        .attr("rx", 5)
        .attr("ry", 5)
        .lower();

    // Add labels to nodes
    const labels = nodeElements.append("text")
        .text((d) => d.name)
        .attr("dx", 0)
        .attr("dy", 0)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", (d) => config.nodes[d.type].label.fontSize)
        .attr("font-weight", (d) => config.nodes[d.type].label.fontWeight)
        .attr("fill", (d) => config.nodes[d.type].label.color)
        .attr("font-family", (d) => config.nodes[d.type].label.fontFamily)
        .raise();

    // Add event listeners to the entire node group
    nodeElements
        .on("mouseover", handleNodeMouseOver)
        .on("mouseout", handleNodeMouseOut)
        .on("click", handleNodeClick);

    simulation = d3.forceSimulation(nodes)
        .force(
            "link",
            d3.forceLink(links).id((d) => d.id)
                .distance(config.forces.link.distance)
                .strength(config.forces.link.strength),
        )
        .force(
            "charge",
            d3.forceManyBody().strength(config.forces.charge.strength),
        )
        .force(
            "center",
            d3.forceCenter(width / 2, height / 2).strength(
                config.forces.center.strength,
            ),
        )
        .force(
            "collision",
            d3.forceCollide().radius(config.forces.collision.radius).strength(
                config.forces.collision.strength,
            ),
        )
        .force("x", d3.forceX(width / 2).strength(config.forces.x.strength))
        .force("y", d3.forceY(height / 2).strength(config.forces.y.strength))
        .on("tick", () => {
            linkElements
                .attr("x1", (d) => d.source.x)
                .attr("y1", (d) => d.source.y)
                .attr("x2", (d) => d.target.x)
                .attr("y2", (d) => d.target.y);

            nodeElements.attr("transform", (d) => `translate(${d.x},${d.y})`);
        });
}

// Event handlers
function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
}

function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

function handleNodeMouseOver(event, d) {
    const element = d3.select(event.currentTarget);

    // Dim all nodes and links
    d3.selectAll(".node").style("opacity", 0.2);
    d3.selectAll(".link").style("opacity", 0.1);

    // Highlight the hovered node
    element.style("opacity", 1);

    // Find connected links
    const connectedLinks = links.filter((link) =>
        link.source.id === d.id || link.target.id === d.id
    );

    // Highlight connected links and their nodes
    connectedLinks.forEach((link) => {
        // Highlight the link
        d3.selectAll(".link")
            .filter((l) => l === link)
            .style("opacity", 1)
            .style("stroke-width", config.links.width * 1.5)
            .style("stroke", config.links.hoverColor)
            .attr("marker-end", "url(#arrowhead)");

        // Update arrow color
        d3.select("#arrowhead path")
            .attr("fill", config.links.hoverColor);

        // Highlight connected node
        const connectedNodeId = link.source.id === d.id
            ? link.target.id
            : link.source.id;
        d3.selectAll(".node")
            .filter((n) => n.id === connectedNodeId)
            .style("opacity", 1);
    });

    // Show tooltip
    tooltip.style("opacity", 1)
        .html(`<div class="tooltip-content">
            <div>${d.name}</div>
            ${d.description ? `<div>${d.description}</div>` : ""}
            ${d.link ? `<div><a href="${d.link}" target="_blank">View Project</a></div>` : ""}
        </div>`)
        .style("left", `${event.pageX + 15}px`)
        .style("top", `${event.pageY + 10}px`);
}

function handleNodeMouseOut(event, d) {
    // Reset all opacities
    d3.selectAll(".node").style("opacity", 1);
    d3.selectAll(".link")
        .style("opacity", config.links.opacity)
        .style("stroke-width", config.links.width)
        .style("stroke", config.links.color)
        .attr("marker-end", null);

    // Reset arrow color
    d3.select("#arrowhead path")
        .attr("fill", config.links.color);

    // Hide tooltip
    tooltip.style("opacity", 0);
}

function handleNodeClick(event, d) {
    if (d.type === "project" && d.link) {
        window.open(d.link, "_blank");
    }
}

// Handle window resize
globalThis.addEventListener("resize", () => {
    d3.select("#graph-container svg").remove();
    initializeGraph();
});

// Load data and initialize graph
fetch("data.json")
    .then((response) => response.json())
    .then((data) => {
        // Transform the data to match the expected format
        const transformedData = {
            nodes: [],
            links: [],
        };

        // Add project nodes
        data.projects.forEach((project) => {
            transformedData.nodes.push({
                id: project.id,
                name: project.name,
                description: project.description,
                link: project.link,
                type: "project"
            });

            // Add tag nodes and links
            project.tags.forEach((tag) => {
                const tagId = `tag-${tag}`;

                // Add tag node if it doesn't exist
                if (!transformedData.nodes.find((n) => n.id === tagId)) {
                    transformedData.nodes.push({
                        id: tagId,
                        name: tag,
                        type: "tag",
                    });
                }

                // Add link between project and tag
                transformedData.links.push({
                    source: project.id,
                    target: tagId,
                });
            });
        });

        nodes = transformedData.nodes;
        links = transformedData.links;
        initializeGraph();
    })
    .catch((error) => console.error("Error loading graph data:", error));
