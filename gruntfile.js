module.exports = function(grunt) {
    var options = {
        package: grunt.file.readJSON('package.json')
    };

    grunt.file.defaultEncoding = 'gb2312';

    options.concat = {
        options: {
            stripBanners: true,
            banner: '/*!\n * <%= package.title || package.name %> - v<%= package.version %> - ' +
                '<%= grunt.template.today("yyyy-mm-dd") %> \n' +
                '<%= package.homepage ? "* " + package.homepage + "\\n" : "" %>' +
                ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= package.author.name %>;' +
                ' Licensed <%= package.license.type + "(" + package.license.url + ")" %> \n */\n'
        },
        'desktop': {
            //zepto event ajax form ie
            src: ['src/tg.js', 'src/page.js', 'src/io.js', 'src/user.js', 'src/ui.js'],
            dest: '../<%= package.name %>.js',
            nonull: true
        },
        'degrade': {
            //zepto event ajax form ie
            src: ['src/tg.js', 'src/page.js', 'src/io.js', 'src/user.js', 'src/ui.js', 'src/degrade.js'],
            dest: '../<%= package.name %>-degrade.js',
            nonull: true
        }
    };

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.initConfig(options);
    // Default task.
    grunt.registerTask('default', ['concat']);

};