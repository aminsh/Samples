﻿
function contextService() {

    function submit(item, url, method) {
        if (config.validateOn == 'submit')
            validation.validate(item);

        if (item.hasError)
            return false;

        var deferred = $.Deferred();

        if (item.hasError) {
            deferred.reject();
            return deferred.promise();
        }
            
        if (!url.startsWith(config.rootUrl))
            url = config.rootUrl + url;

        if (isNullOrEmpty(method))
            method = 'POST';

        var options = {
            dataType: "json",
            contentType: "application/json",
            cache: false,
            type: method,
            data: item
        };

        $.ajax(url, options)
            .done(function(result){ deferred.resolve(); })
            .fail(function(error) { deferred.reject(); });

        return deferred.promise();
    }

    function query(url) {
        var q = {
            url: url,
        }

        q.addParameters = function(args) {
            $.extend(true, q.parameters, args);
            return q;
        }

        q.mapTo = function(modelName) {
            q.mapperName = modelName;
        };

        q.execute = function() {
            var options = {
                dataType: "json",
                contentType: "application/json",
                cache: false,
                type: 'GET'
            };

            var deferred = $.Deferred();

            if (!isNullOrEmpty(q.parameters))
                options.data = q.parameters;

            $.ajax(config.rootUrl + url, options)
                .done(function(result) {
                    if (isNullOrEmpty(q.mapperName))
                        return result;
                    var mapper = baseMapping.first(
                        function(m) { return m.Name == q.mapperName; });

                    if (isArray(result))
                        return result.select(
                            function(item) { return mapper.map(item); });
                    return mapper.map(result);

                }).fail(function(error) {
                    console.error(error);
                });

            return deferred.promise();
        }

        return q;
    }

    function factory(modelName) {
        var item = {
            hasError: false,
            errors: []
        };

        var type = baseConfig.first(function (m) { return m.Name == modelName; });
        item.type = type;
        item.submit = function(url, method) {
            submit(item, url, method);
        };

        if (config.validateOn == 'propertyChange')
            item.onChange(function() {
                validation.validate(item);
            });

        return item;
    }

    return {
        submit: submit,
        query: query,
        factory: factory
    };
}

define([
    'app',
    'modelMap/baseMapping',
    'modelConfig/baseConfig',
    'modelConfig/config',
    'modelConfig/validation/validate'
], context);


function context(app, baseMapping, baseConfig, config, validation) {
    app.factory('contextService', [contextService]);
}