const path = require(`path`);
const { createFilePath } = require(`gatsby-source-filesystem`);

// Define templates for each category
const spiritualPost = path.resolve(`./src/templates/spiritual.js`);
const physicalPost = path.resolve(`./src/templates/physical.js`);

exports.createPages = async ({ graphql, actions, reporter }) => {
  const { createPage } = actions;

  // Query all markdown files
  const result = await graphql(`
    {
      allMarkdownRemark(sort: { frontmatter: { date: ASC } }, limit: 1000) {
        nodes {
          id
          frontmatter {
            category
          }
          fields {
            slug
          }
        }
      }
    }
  `);

  if (result.errors) {
    reporter.panicOnBuild(`There was an error loading your blog posts`, result.errors);
    return;
  }

  const posts = result.data.allMarkdownRemark.nodes;

  // Create pages for each post
  posts.forEach((post, index) => {
    const previousPostId = index === 0 ? null : posts[index - 1].id;
    const nextPostId = index === posts.length - 1 ? null : posts[index + 1].id;

    // Determine the template based on the category
    const template = post.frontmatter.category === "spiritual" ? spiritualPost :
                     post.frontmatter.category === "physical" ? physicalPost :
                     null;

    if (template) {
      createPage({
        path: post.fields.slug, // e.g., /spiritual/my-post
        component: template,
        context: {
          id: post.id,
          previousPostId,
          nextPostId,
        },
      });
    }
  });
};

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions;

  if (node.internal.type === `MarkdownRemark`) {
    const value = createFilePath({ node, getNode });

    createNodeField({
      name: `slug`,
      node,
      value,
    });
  }
};

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions;

  // Define the schema for MarkdownRemark
  createTypes(`
    type MarkdownRemark implements Node {
      frontmatter: Frontmatter
      fields: Fields
    }

    type Frontmatter {
      title: String
      description: String
      date: Date @dateformat
      category: String
    }

    type Fields {
      slug: String
    }
  `);
};