import * as React from 'react';
// a custom hook for setting the page title
export function useDocumentTitle(title) {
    React.useEffect(function () {
        var originalTitle = document.title;
        document.title = title;
        return function () {
            document.title = originalTitle;
        };
    }, [title]);
}
